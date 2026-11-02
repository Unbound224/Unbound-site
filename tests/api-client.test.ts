import { describe, expect, it, vi } from 'vitest';
import openapi from '../fixtures/core-openapi.v1.json';
import { ApiClientError, createClient, describeError, ENDPOINTS } from '@/lib/api/client';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const redemption = {
  id: 'red_1', state: 'RETURN_CONFIRMED', asset: { code: 'SHOP', issuer: 'G'.padEnd(56, 'A') }, amount: '30.0000000', holder: 'G'.padEnd(56, 'B'),
  returnTxHash: 'a'.repeat(64), refundDue: false, rejectionReason: null, createdAt: '2026-11-02T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z',
};

describe('contract with unbound-core', () => {
  it('every endpoint the site calls exists in the checked-in core OpenAPI snapshot', () => {
    for (const e of Object.values(ENDPOINTS)) {
      const op = (openapi.paths as Record<string, Record<string, unknown>>)[e.path];
      expect(op, `${e.method} ${e.path}`).toBeTruthy();
      expect(op![e.method.toLowerCase()], `${e.method} ${e.path}`).toBeTruthy();
    }
  });
});

describe('api client', () => {
  it('sends the bearer token in a header, never in the URL, and parses the response', async () => {
    const f = vi.fn().mockResolvedValue(json({ redemptions: [redemption] }));
    const c = createClient({ baseUrl: 'http://api.test/', token: 'tok_secret', fetchImpl: f });
    const out = await c.listRedemptions();
    expect(out[0]?.state).toBe('RETURN_CONFIRMED');
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe('http://api.test/v1/merchants/me/redemptions');
    expect(String(url)).not.toContain('tok_secret');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok_secret');
  });

  it('maps the core error envelope to a typed error with requestId', async () => {
    const f = vi.fn().mockResolvedValue(json({ error: { code: 'INVALID_STATE', message: 'x', requestId: 'req_9' } }, 409));
    const err = await createClient({ baseUrl: 'http://api.test', fetchImpl: f }).confirmRedemption('red_1').catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err).toMatchObject({ code: 'INVALID_STATE', status: 409, requestId: 'req_9' });
    expect(describeError(err)).toMatch(/confirmed on the ledger/);
  });

  it('reports an unreachable API, non-JSON, malformed errors and contract drift distinctly', async () => {
    const net = createClient({ baseUrl: 'http://x', fetchImpl: vi.fn().mockRejectedValue(new TypeError('fetch failed')) });
    await expect(net.listAssets()).rejects.toMatchObject({ code: 'NETWORK' });
    const html = createClient({ baseUrl: 'http://x', fetchImpl: vi.fn().mockResolvedValue(new Response('<html>', { status: 502 })) });
    await expect(html.listAssets()).rejects.toMatchObject({ code: 'BAD_RESPONSE', status: 502 });
    const weirdErr = createClient({ baseUrl: 'http://x', fetchImpl: vi.fn().mockResolvedValue(json({ nope: 1 }, 500)) });
    await expect(weirdErr.listAssets()).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
    const drift = createClient({ baseUrl: 'http://x', fetchImpl: vi.fn().mockResolvedValue(json({ redemptions: [{ id: 'x' }] })) });
    await expect(drift.listRedemptions()).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
  });

  it('aborts slow requests', async () => {
    const f = vi.fn((_u: string, init: RequestInit) => new Promise<Response>((_res, rej) => init.signal!.addEventListener('abort', () => rej(new Error('aborted')))));
    const c = createClient({ baseUrl: 'http://x', fetchImpl: f as unknown as typeof fetch, timeoutMs: 20 });
    await expect(c.listAssets()).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('validates the application before sending and url-encodes ids', async () => {
    const f = vi.fn().mockResolvedValue(json(redemption));
    const c = createClient({ baseUrl: 'http://x', fetchImpl: f });
    expect(() => c.apply({ legalName: 'x', jurisdiction: '', contact: '' })).toThrow();
    await c.confirmRedemption('red/../1');
    expect(f.mock.calls[0]![0]).toBe('http://x/v1/merchants/me/redemptions/red%2F..%2F1/confirm');
  });

  it('hides raw server messages for unknown codes behind the server-provided safe message only', () => {
    expect(describeError(new ApiClientError('SOMETHING_NEW', 'safe summary', 422))).toBe('safe summary');
    expect(describeError(new Error('stack with secrets'))).toBe('Something went wrong. Please try again.');
  });
});
