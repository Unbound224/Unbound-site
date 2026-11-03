import { vi } from 'vitest';
import type { Client } from '@/lib/api/client';

/** Mocks for every client method; tests override what they exercise. */
export function allClientMocks(): Client {
  return {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({ ok: true }),
    apply: vi.fn(),
    listAssets: vi.fn().mockResolvedValue([]),
    listRedemptions: vi.fn().mockResolvedValue([]),
    confirmRedemption: vi.fn(),
    rejectRedemption: vi.fn(),
    submitEscrowAction: vi.fn(),
    requestPasswordReset: vi.fn().mockResolvedValue({ accepted: true }),
    confirmPasswordReset: vi.fn().mockResolvedValue({ ok: true }),
    listDisputes: vi.fn().mockResolvedValue([]),
    addDisputeMessage: vi.fn(),
    resolveDispute: vi.fn(),
    listMerchants: vi.fn().mockResolvedValue([]),
    verifyMerchant: vi.fn(),
    revokeMerchant: vi.fn(),
    listJobs: vi.fn().mockResolvedValue([]),
    runJob: vi.fn(),
  } as unknown as Client;
}
