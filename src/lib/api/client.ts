import { z } from 'zod';
import { Asset, Credentials, ErrorEnvelope, LoginResult, Merchant, MerchantApplication, Redemption } from './schemas';

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/** Every endpoint this site calls. A test asserts each exists in the checked-in core OpenAPI snapshot. */
export const ENDPOINTS = {
  apply: { method: 'POST', path: '/v1/merchants/apply' },
  register: { method: 'POST', path: '/v1/auth/register' },
  login: { method: 'POST', path: '/v1/auth/login' },
  logout: { method: 'POST', path: '/v1/auth/logout' },
  listAssets: { method: 'GET', path: '/v1/assets' },
  listRedemptions: { method: 'GET', path: '/v1/merchants/me/redemptions' },
  confirmRedemption: { method: 'POST', path: '/v1/merchants/me/redemptions/{id}/confirm' },
} as const;

export interface ClientOptions {
  baseUrl: string;
  /** merchant session token; held in memory only, never persisted by this site */
  token?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function createClient(opts: ClientOptions) {
  const doFetch = opts.fetchImpl ?? fetch;

  async function request<T>(method: string, path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);
    let res: Response;
    try {
      res = await doFetch(opts.baseUrl.replace(/\/$/, '') + path, {
        method,
        signal: ctrl.signal,
        headers: {
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new ApiClientError('NETWORK', 'The Unbound API is unreachable.', 0);
    } finally {
      clearTimeout(timer);
    }
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new ApiClientError('BAD_RESPONSE', 'The API returned a response that is not JSON.', res.status);
    }
    if (!res.ok) {
      const e = ErrorEnvelope.safeParse(json);
      if (e.success) throw new ApiClientError(e.data.error.code, e.data.error.message, res.status, e.data.error.requestId);
      throw new ApiClientError('BAD_RESPONSE', 'The API returned an unexpected error.', res.status);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw new ApiClientError('BAD_RESPONSE', 'The API response did not match the expected contract.', res.status);
    return parsed.data;
  }

  return {
    register: (input: Credentials) => request('POST', ENDPOINTS.register.path, z.object({ id: z.string(), email: z.string() }), Credentials.parse(input)),
    login: (input: Credentials) => request('POST', ENDPOINTS.login.path, LoginResult, Credentials.parse(input)),
    logout: () => request('POST', ENDPOINTS.logout.path, z.object({ ok: z.boolean() }), {}),
    apply: (input: MerchantApplication) => request('POST', ENDPOINTS.apply.path, Merchant, MerchantApplication.parse(input)),
    listAssets: (issuer?: string) =>
      request('GET', ENDPOINTS.listAssets.path + (issuer ? `?issuer=${encodeURIComponent(issuer)}` : ''), z.object({ assets: z.array(Asset) })).then((r) => r.assets),
    listRedemptions: () => request('GET', ENDPOINTS.listRedemptions.path, z.object({ redemptions: z.array(Redemption) })).then((r) => r.redemptions),
    confirmRedemption: (id: string) =>
      request('POST', ENDPOINTS.confirmRedemption.path.replace('{id}', encodeURIComponent(id)), Redemption),
  };
}

export type Client = ReturnType<typeof createClient>;

const FRIENDLY: Record<string, string> = {
  NETWORK: 'Cannot reach the Unbound API. Check that unbound-core is running and try again.',
  UNAUTHENTICATED: 'Sign-in failed or your session expired. Check your email and password and try again.',
  INVALID_STATE_EXISTS: 'An account with this email already exists.',
  FORBIDDEN: 'Your account is not allowed to do that.',
  INVALID_STATE: 'This redemption cannot be confirmed yet. The returned credit must be confirmed on the ledger first.',
  SENSITIVE_ACTIONS_PAUSED: 'Actions are paused while a ledger discrepancy is investigated.',
  NOT_FOUND: 'That item was not found.',
  BAD_RESPONSE: 'The API answered in an unexpected way. Nothing was changed on your side.',
};

export function describeError(e: unknown): string {
  if (e instanceof ApiClientError) return FRIENDLY[e.code] ?? e.message;
  return 'Something went wrong. Please try again.';
}

export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
}
