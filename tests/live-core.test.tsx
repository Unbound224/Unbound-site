/**
 * LIVE-CORE test. Spawns the REAL unbound-core server process (sibling checkout ../Unbound-core, run with
 * tsx, SQLite file, FakeStellarGateway test adapter) after seeding it with core's synthetic e2e seed, then
 * drives this site's real components and real API client over HTTP. Skipped when the sibling is absent.
 * Nothing here touches Stellar.
 */
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Dashboard } from '@/components/Dashboard';
import { SessionProvider } from '@/lib/session';

const core = join(process.cwd(), '../Unbound-core');
const present = existsSync(join(core, 'scripts/seed-e2e.ts'));
const d = present ? describe : describe.skip;

// Throwaway test credentials for a synthetic, local-only database.
const ENV = {
  BOOTSTRAP_ADMIN_EMAIL: 'admin@example.invalid',
  BOOTSTRAP_ADMIN_PASSWORD: 'e2e-admin-password-1234',
  SEED_MERCHANT_EMAIL: 'shop@example.invalid',
  SEED_MERCHANT_PASSWORD: 'e2e-shop-password-12345',
};

let dir: string;
let child: ChildProcess | undefined;
let facts: { ready: string; waiting: string };

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as { port: number }).port;
      s.close(() => resolve(p));
    });
    s.on('error', reject);
  });
}

beforeAll(async () => {
  if (!present) return;
  dir = mkdtempSync(join(tmpdir(), 'unbound-e2e-'));
  const dbEnv = { ...process.env, ...ENV, DATABASE_FILE: join(dir, 'core.db'), NODE_NO_WARNINGS: '1' };
  const out = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/seed-e2e.ts'], { cwd: core, env: dbEnv, encoding: 'utf8' });
  facts = JSON.parse(out.trim().split('\n').at(-1)!);
  const port = await freePort();
  child = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], { cwd: core, env: { ...dbEnv, PORT: String(port), APP_ENV: 'development' }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('core did not start')), 60_000);
    child!.stdout!.on('data', (b: Buffer) => {
      if (b.toString().includes('DEV server on')) {
        clearTimeout(t);
        resolve();
      }
    });
    child!.on('exit', (c) => reject(new Error(`core exited early (${c})`)));
  });
  process.env.NEXT_PUBLIC_API_URL = `http://127.0.0.1:${port}`;
}, 90_000);

afterAll(async () => {
  // Wait for the core process to exit before deleting its SQLite file: Windows refuses to delete an open file.
  if (child && child.exitCode === null) {
    const exited = new Promise<void>((resolve) => child!.once('exit', () => resolve()));
    child.kill('SIGTERM');
    await Promise.race([exited, new Promise<void>((resolve) => setTimeout(resolve, 10_000))]);
  }
  if (dir) rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});

const api = (path: string, init: RequestInit = {}) => fetch(process.env.NEXT_PUBLIC_API_URL + path, init);

async function signIn(password: string) {
  await userEvent.type(screen.getByLabelText('Email'), ENV.SEED_MERCHANT_EMAIL);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

d('site <-> real core process over HTTP', () => {
  it('rejects a wrong password with the generic message and shows no console', async () => {
    render(<SessionProvider><Dashboard /></SessionProvider>);
    await signIn('definitely not the password');
    expect(await screen.findByRole('alert')).toHaveTextContent(/Check your email and password/);
    expect(screen.queryByRole('region', { name: /redemption queue/i })).toBeNull();
  });

  it('signs in, shows the verified program and the redemption queue; only the ledger-confirmed return can be confirmed', async () => {
    render(<SessionProvider><Dashboard /></SessionProvider>);
    await signIn(ENV.SEED_MERCHANT_PASSWORD);
    expect(await screen.findByText('SHOP')).toBeInTheDocument();
    expect(screen.getByText(/1 SHOP = 1 USD of store credit \(synthetic\)/)).toBeInTheDocument();
    const queue = await screen.findByRole('region', { name: /redemption queue/i });
    const buttons = within(queue).getAllByRole('button', { name: /confirm fulfilment/i }) as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);
    expect(buttons.filter((b) => !b.disabled)).toHaveLength(1);
    expect(screen.getByText(/not confirmed on the ledger yet/i)).toBeInTheDocument();

    await userEvent.click(buttons.find((b) => !b.disabled)!);
    expect(await screen.findByText(/confirmed as fulfilled/i)).toBeInTheDocument();
    expect(await screen.findByText(/· Fulfilled/)).toBeInTheDocument();
  });

  it('the server really recorded it: a fresh API call shows FULFILLED for one and still-waiting for the other', async () => {
    const login = await api('/v1/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: ENV.SEED_MERCHANT_EMAIL, password: ENV.SEED_MERCHANT_PASSWORD }) });
    const { token } = (await login.json()) as { token: string };
    const list = await api('/v1/merchants/me/redemptions', { headers: { authorization: `Bearer ${token}` } });
    const rows = ((await list.json()) as { redemptions: { id: string; state: string }[] }).redemptions;
    expect(Object.fromEntries(rows.map((r) => [r.id, r.state]))).toEqual({ [facts.ready]: 'FULFILLED', [facts.waiting]: 'RETURN_SUBMITTED' });
    // confirming the waiting one is refused by the server itself (not just hidden by the UI)
    const bad = await api(`/v1/merchants/me/redemptions/${facts.waiting}/confirm`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: '{}' });
    expect(bad.status).toBe(409);
    // logout revokes the token server-side
    await api('/v1/auth/logout', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: '{}' });
    expect((await api('/v1/merchants/me/redemptions', { headers: { authorization: `Bearer ${token}` } })).status).toBe(401);
  });
});
