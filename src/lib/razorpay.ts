import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

let client: Razorpay | null = null;

/** Lazily build the Razorpay client; throws a clear error if keys are missing. */
export function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, 'Payments are not configured on the server');
  }
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

/** Verify the checkout callback signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return timingSafeEqual(expected, signature);
}

/** Verify a webhook payload signature: HMAC_SHA256(rawBody, webhook_secret). */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ApiError(500, 'Razorpay webhook secret is not configured');
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
