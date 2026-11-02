import { z } from 'zod';

/** Mirrors unbound-core's public projections (see fixtures/core-openapi.v1.json). Unknown fields are tolerated for forward compatibility. */
export const ErrorEnvelope = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }),
});

export const RedemptionState = z.enum(['AWAITING_RETURN', 'RETURN_SUBMITTED', 'RETURN_CONFIRMED', 'FULFILLED', 'REJECTED', 'FAILED', 'CANCELLED']);
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
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Redemption = z.infer<typeof Redemption>;

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
