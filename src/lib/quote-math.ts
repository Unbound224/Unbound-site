/**
 * The quote arithmetic Unbound uses, reproduced for the landing-page explainer: exact 7-decimal
 * base units (bigint), never floats. The rate is ILLUSTRATIVE; real quotes come from the Stellar
 * order books and can be refused when no route exists.
 */
export const UNIT = 10_000_000n;
/** The Stellar adapter refuses slippage caps above 10%. */
export const MAX_SLIPPAGE_BPS = 1000;

export interface QuoteMath {
  sourceUnits: bigint;
  expectedUnits: bigint;
  minUnits: bigint;
  /** the part of the expected amount you accept to give up if the market moves */
  bufferUnits: bigint;
}

export function explainQuote(sourceUnits: bigint, rate: { n: bigint; d: bigint }, slippageBps: number): QuoteMath {
  if (sourceUnits <= 0n) throw new RangeError('amount must be positive');
  if (!Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps > MAX_SLIPPAGE_BPS) throw new RangeError('slippage cap must be 0-10%');
  if (rate.n <= 0n || rate.d <= 0n) throw new RangeError('rate must be positive');
  const expectedUnits = (sourceUnits * rate.n) / rate.d;
  const minUnits = (expectedUnits * BigInt(10_000 - slippageBps)) / 10_000n;
  return { sourceUnits, expectedUnits, minUnits, bufferUnits: expectedUnits - minUnits };
}

/** 7-dp display, trailing zeros trimmed to 2 decimals minimum ("72.00", "71.28", "0.0000001"). */
export function formatUnits(u: bigint): string {
  const neg = u < 0n;
  const a = neg ? -u : u;
  const whole = a / UNIT;
  let frac = (a % UNIT).toString().padStart(7, '0').replace(/0+$/, '');
  if (frac.length < 2) frac = frac.padEnd(2, '0');
  return `${neg ? '-' : ''}${whole.toString()}.${frac}`;
}
