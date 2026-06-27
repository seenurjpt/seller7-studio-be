import { env } from '../../config/env';
import { CREDIT_PACKS, getCreditPack } from '../../config/creditPacks';
import { User } from '../../models/user.model';
import { Payment, IPaymentDocument } from '../../models/payment.model';
import { getRazorpay, verifyPaymentSignature } from '../../lib/razorpay';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../lib/logger';

export interface CreatedOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  pack: { id: string; name: string; credits: number };
}

/** List the catalog for the storefront (no secret data). */
export function listPacks() {
  return CREDIT_PACKS.map(({ id, name, credits, amount, currency }) => ({
    id,
    name,
    credits,
    amount,
    currency,
  }));
}

export async function createOrder(userId: string, packId: string): Promise<CreatedOrder> {
  const pack = getCreditPack(packId);
  if (!pack) throw new ApiError(400, 'Unknown credit pack');

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: pack.amount,
    currency: pack.currency,
    receipt: `rcpt_${Date.now()}`,
    notes: { userId, packId: pack.id },
  });

  await Payment.create({
    user: userId,
    packId: pack.id,
    credits: pack.credits,
    amount: pack.amount,
    currency: pack.currency,
    razorpayOrderId: order.id,
    status: 'created',
  });

  return {
    orderId: order.id,
    amount: pack.amount,
    currency: pack.currency,
    keyId: env.RAZORPAY_KEY_ID,
    pack: { id: pack.id, name: pack.name, credits: pack.credits },
  };
}

/**
 * Atomically mark a paid order as granted and add its credits to the user.
 * The `creditsGranted: false` filter guarantees credits are added at most once,
 * so the verify endpoint and the webhook can both safely call this.
 * Returns the user's new balance, or null if the order was already granted.
 */
async function grantCredits(
  orderId: string,
  paymentId: string,
  signature?: string,
): Promise<{ credits: number; payment: IPaymentDocument } | null> {
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: orderId, creditsGranted: false },
    {
      $set: {
        status: 'paid',
        creditsGranted: true,
        razorpayPaymentId: paymentId,
        ...(signature ? { razorpaySignature: signature } : {}),
      },
    },
    { new: true },
  );

  if (!payment) return null; // unknown order or already granted

  const user = await User.findByIdAndUpdate(
    payment.user,
    { $inc: { credits: payment.credits } },
    { new: true },
  );

  if (!user) {
    // Extremely unlikely; surface loudly rather than silently lose the grant.
    logger.error({ orderId, userId: payment.user }, 'Granted credits but user not found');
    throw new ApiError(404, 'User not found');
  }

  logger.info(
    { orderId, paymentId, userId: String(user._id), added: payment.credits, balance: user.credits },
    'Credits granted',
  );
  return { credits: user.credits, payment };
}

/** Called from the browser after checkout succeeds. Verifies signature, then credits. */
export async function verifyAndCredit(
  userId: string,
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<{ credits: number; alreadyProcessed: boolean }> {
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    await Payment.findOneAndUpdate({ razorpayOrderId: orderId }, { $set: { status: 'failed' } });
    throw new ApiError(400, 'Payment signature verification failed');
  }

  // Ensure this order belongs to the requesting user.
  const owned = await Payment.findOne({ razorpayOrderId: orderId, user: userId });
  if (!owned) throw new ApiError(404, 'Order not found');

  const result = await grantCredits(orderId, paymentId, signature);
  if (result) return { credits: result.credits, alreadyProcessed: false };

  // Already granted (e.g. webhook beat us here) — return the current balance.
  const user = await User.findById(userId);
  return { credits: user?.credits ?? 0, alreadyProcessed: true };
}

/** Razorpay webhook safety net — idempotent grant on payment.captured. */
export async function handlePaymentCaptured(orderId: string, paymentId: string): Promise<void> {
  await grantCredits(orderId, paymentId);
}

export async function getBalance(userId: string): Promise<number> {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user.credits;
}

export async function listPayments(userId: string) {
  // .lean() skips the toJSON transform, so explicitly drop sensitive fields.
  return Payment.find({ user: userId, status: 'paid' })
    .select('-razorpaySignature -__v')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}
