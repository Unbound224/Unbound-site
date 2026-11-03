import { z } from 'zod';

/** Mirrors unbound-core's public projections (see fixtures/core-openapi.v1.json). Unknown fields are tolerated for forward compatibility. */
export const ErrorEnvelope = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }),
});

export const RedemptionState = z.enum(['AWAITING_RETURN', 'RETURN_SUBMITTED', 'RETURN_CONFIRMED', 'FULFILLED', 'REJECTED', 'EXPIRED', 'FAILED', 'CANCELLED']);
export type RedemptionState = z.infer<typeof RedemptionState>;

export const Redemption = z.object({
  id: z.string(),
  state: RedemptionState,
  asset: z.object({ code: z.string(), issuer: z.string() }),
  amount: z.string(),
  holder: z.string(),
  returnTxHash: z.string().nullable(),
  refundDue: z.boolean(),
  rejectionReason: z.string().nullable(),
  /** NATIVE = classic return payment; ESCROW = held by the Soroban redemption escrow (core ADR 0002). Older cores omit both fields. */
  mode: z.enum(['NATIVE', 'ESCROW']).default('NATIVE'),
  escrow: z
    .object({
      contractId: z.string(),
      deadline: z.string(),
      state: z.enum(['AWAITING_OPEN', 'HELD', 'RELEASED', 'REFUNDED', 'EXPIRED_REFUNDED']),
      refundAvailable: z.boolean(),
      pendingAction: z.enum(['CONFIRM', 'REJECT', 'EXPIRE']).nullable(),
      pendingXdr: z.string().nullable(),
      pendingTxHash: z.string().nullable(),
      closeTxHash: z.string().nullable(),
      lastFailure: z.string().nullable(),
    })
    .nullable()
    .default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Redemption = z.infer<typeof Redemption>;
export type RedemptionInput = z.input<typeof Redemption>;
export type EscrowView = NonNullable<Redemption['escrow']>;

export const DisputeState = z.enum(['OPEN', 'MERCHANT_RESPONDED', 'ESCALATED', 'RESOLVED_FOR_HOLDER', 'RESOLVED_FOR_MERCHANT', 'WITHDRAWN']);
export type DisputeState = z.infer<typeof DisputeState>;

export const Dispute = z.object({
  id: z.string(),
  kind: z.enum(['REDEMPTION', 'EXCHANGE']),
  subjectRef: z.string(),
  merchantId: z.string().optional(),
  reason: z.string(),
  state: DisputeState,
  messages: z.array(z.object({ at: z.string(), authorId: z.string(), authorRole: z.string(), text: z.string() })),
  respondBy: z.string().optional(),
  resolution: z.object({ outcome: z.enum(['FOR_HOLDER', 'FOR_MERCHANT']), note: z.string(), decidedBy: z.string(), at: z.string() }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Dispute = z.infer<typeof Dispute>;

/** Dispute messages and rulings: 10-2000 characters (core enforces the same). */
export const DisputeText = z.string().trim().min(10, 'Write at least 10 characters').max(2000, 'Keep it under 2000 characters');

export const AdminMerchant = z.object({
  id: z.string(),
  legalName: z.string(),
  jurisdiction: z.string(),
  contact: z.string(),
  status: z.enum(['APPLIED', 'VERIFIED', 'REJECTED', 'REVOKED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminMerchant = z.infer<typeof AdminMerchant>;

export const JobStatus = z.object({
  name: z.string(),
  intervalMs: z.number(),
  running: z.boolean(),
  runs: z.number(),
  failures: z.number(),
  consecutiveFailures: z.number(),
  lastStartedAt: z.string().nullable(),
  lastFinishedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  lastItems: z.number().nullable(),
  nextEligibleAt: z.string().nullable(),
});
export type JobStatus = z.infer<typeof JobStatus>;

export const ResetEmail = z.object({ email: z.string().trim().min(3, 'Enter your email').email('Enter a valid email') }).strict();
export const NewPassword = z
  .object({ token: z.string().min(20, 'This reset link is incomplete. Open the link from your email again.'), password: z.string().min(12, 'Password must be at least 12 characters') })
  .strict();

/** A signed transaction envelope pasted back from the issuer's own signer (base64 XDR). */
export const SignedXdr = z.string().trim().min(20, 'Paste the signed transaction (base64 XDR)').max(50_000).regex(/^[A-Za-z0-9+/=\s]+$/, 'That does not look like base64 XDR');

export const Asset = z.object({
  id: z.string(),
  assetCode: z.string(),
  issuer: z.string(),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  policy: z.object({
    unitOfAccount: z.string(),
    expiresAt: z.string(),
    jurisdiction: z.string(),
    refundPolicy: z.string(),
    contact: z.string(),
    redemptionLimits: z.object({ minUnits: z.string().optional(), maxUnitsPerRequest: z.string().optional() }),
  }),
});
export type Asset = z.infer<typeof Asset>;

export const Merchant = z.object({ id: z.string(), legalName: z.string(), status: z.enum(['APPLIED', 'VERIFIED', 'REJECTED', 'REVOKED']) });
export type Merchant = z.infer<typeof Merchant>;

export const MerchantApplication = z
  .object({
    legalName: z.string().trim().min(2, 'Legal name must be at least 2 characters').max(200),
    jurisdiction: z.string().trim().min(2, 'Jurisdiction is required').max(100),
    contact: z.string().trim().min(3, 'A contact is required').max(200),
  })
  .strict();
export type MerchantApplication = z.infer<typeof MerchantApplication>;

export const LoginResult = z.object({ token: z.string().min(1), role: z.enum(['user', 'merchant', 'admin']), accountId: z.string() });
export type LoginResult = z.infer<typeof LoginResult>;

export const Credentials = z
  .object({
    email: z.string().trim().min(3, 'Enter your email').email('Enter a valid email'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
  })
  .strict();
export type Credentials = z.infer<typeof Credentials>;
