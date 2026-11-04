import { z } from 'zod';
import { AdminMerchant, Asset, Credentials, Dispute, DisputeText, ErrorEnvelope, JobStatus, LoginCredentials, LoginResult, Merchant, MerchantApplication, NewPassword, Redemption, ResetEmail, SignedXdr } from './schemas';

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
  rejectRedemption: { method: 'POST', path: '/v1/merchants/me/redemptions/{id}/reject' },
  submitEscrowAction: { method: 'POST', path: '/v1/merchants/me/redemptions/{id}/escrow/submit' },
  requestPasswordReset: { method: 'POST', path: '/v1/auth/password-reset' },
  confirmPasswordReset: { method: 'POST', path: '/v1/auth/password-reset/confirm' },
  listDisputes: { method: 'GET', path: '/v1/disputes' },
  addDisputeMessage: { method: 'POST', path: '/v1/disputes/{id}/messages' },
  resolveDispute: { method: 'POST', path: '/v1/admin/disputes/{id}/resolve' },
  listMerchants: { method: 'GET', path: '/v1/admin/merchants' },
  verifyMerchant: { method: 'POST', path: '/v1/admin/merchants/{id}/verify' },
  revokeMerchant: { method: 'POST', path: '/v1/admin/merchants/{id}/revoke' },
  listJobs: { method: 'GET', path: '/v1/admin/jobs' },
  runJob: { method: 'POST', path: '/v1/admin/jobs/{name}/run' },
} as const;

const at = (path: string, key: string, value: string) => path.replace(`{${key}}`, encodeURIComponent(value));

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
    login: (input: LoginCredentials) => request('POST', ENDPOINTS.login.path, LoginResult, LoginCredentials.parse(input)),
    logout: () => request('POST', ENDPOINTS.logout.path, z.object({ ok: z.boolean() }), {}),
    apply: (input: MerchantApplication) => request('POST', ENDPOINTS.apply.path, Merchant, MerchantApplication.parse(input)),
    listAssets: (issuer?: string) =>
      request('GET', ENDPOINTS.listAssets.path + (issuer ? `?issuer=${encodeURIComponent(issuer)}` : ''), z.object({ assets: z.array(Asset) })).then((r) => r.assets),
    listRedemptions: () => request('GET', ENDPOINTS.listRedemptions.path, z.object({ redemptions: z.array(Redemption) })).then((r) => r.redemptions),
    confirmRedemption: (id: string) =>
      request('POST', ENDPOINTS.confirmRedemption.path.replace('{id}', encodeURIComponent(id)), Redemption),
    rejectRedemption: (id: string, reason: string) => request('POST', at(ENDPOINTS.rejectRedemption.path, 'id', id), Redemption, { reason: z.string().trim().min(3).max(500).parse(reason) }),
    submitEscrowAction: (id: string, signedXdr: string) => request('POST', at(ENDPOINTS.submitEscrowAction.path, 'id', id), Redemption, { signedXdr: SignedXdr.parse(signedXdr).replace(/\s+/g, '') }),
    requestPasswordReset: (email: string) => request('POST', ENDPOINTS.requestPasswordReset.path, z.object({ accepted: z.literal(true) }), ResetEmail.parse({ email })),
    confirmPasswordReset: (token: string, password: string) => request('POST', ENDPOINTS.confirmPasswordReset.path, z.object({ ok: z.literal(true) }), NewPassword.parse({ token, password })),
    listDisputes: () => request('GET', ENDPOINTS.listDisputes.path, z.object({ disputes: z.array(Dispute) })).then((r) => r.disputes),
    addDisputeMessage: (id: string, text: string) => request('POST', at(ENDPOINTS.addDisputeMessage.path, 'id', id), Dispute, { text: DisputeText.parse(text) }),
    resolveDispute: (id: string, outcome: 'FOR_HOLDER' | 'FOR_MERCHANT', note: string) => request('POST', at(ENDPOINTS.resolveDispute.path, 'id', id), Dispute, { outcome, note: DisputeText.parse(note) }),
    listMerchants: () => request('GET', ENDPOINTS.listMerchants.path, z.object({ merchants: z.array(AdminMerchant) })).then((r) => r.merchants),
    verifyMerchant: (id: string, evidenceRef: string) => request('POST', at(ENDPOINTS.verifyMerchant.path, 'id', id), z.object({ status: z.literal('VERIFIED') }).passthrough(), { evidenceRef: z.string().trim().min(3).max(200).parse(evidenceRef) }),
    revokeMerchant: (id: string, reason: string) => request('POST', at(ENDPOINTS.revokeMerchant.path, 'id', id), z.object({ ok: z.literal(true) }), { reason: z.string().trim().min(3).max(500).parse(reason) }),
    listJobs: () => request('GET', ENDPOINTS.listJobs.path, z.object({ jobs: z.array(JobStatus) })).then((r) => r.jobs),
    runJob: (name: string) => request('POST', at(ENDPOINTS.runJob.path, 'name', name), JobStatus),
  };
}

export type Client = ReturnType<typeof createClient>;

const FRIENDLY: Record<string, string> = {
  NETWORK: 'Cannot reach the Unbound API. Check that unbound-core is running and try again.',
  UNAUTHENTICATED: 'Sign-in failed or your session expired. Check your email and password and try again.',
  INVALID_STATE_EXISTS: 'An account with this email already exists.',
  FORBIDDEN: 'Your account is not allowed to do that.',
  INVALID_STATE: 'This redemption cannot be confirmed yet. The returned credit must be confirmed on the ledger first.',
  GATEWAY_REJECTED: 'The Stellar side refused this step. Nothing was signed or moved; refresh and try again.',
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
