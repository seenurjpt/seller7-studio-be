/**
 * Authoritative credit-pack catalog. The server NEVER trusts an amount sent by
 * the client — it looks the pack up here by id and uses these values to create
 * the Razorpay order and to grant credits. Keep amounts in the smallest
 * currency unit (paise for INR), as Razorpay expects.
 */
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  /** Charge amount in paise (₹1 = 100 paise). */
  amount: number;
  currency: 'INR';
}

export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: 'trial', name: 'Trial', credits: 10, amount: 29900, currency: 'INR' },
  { id: 'starter', name: 'Starter', credits: 30, amount: 69900, currency: 'INR' },
  { id: 'popular', name: 'Popular', credits: 100, amount: 199900, currency: 'INR' },
  { id: 'bulk', name: 'Bulk', credits: 500, amount: 799900, currency: 'INR' },
] as const;

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
