import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import { createOrderSchema, verifyPaymentSchema } from './payment.validation';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { verifyWebhookSignature } from '../../lib/razorpay';
import { logger } from '../../lib/logger';

export async function getPacks(_req: Request, res: Response) {
  res.json(ApiResponse.ok('Credit packs', paymentService.listPacks()));
}

export async function getBalance(req: Request, res: Response) {
  const credits = await paymentService.getBalance(String(req.user!._id));
  res.json(ApiResponse.ok('Credit balance', { credits }));
}

export async function getHistory(req: Request, res: Response) {
  const payments = await paymentService.listPayments(String(req.user!._id));
  res.json(ApiResponse.ok('Payment history', payments));
}

export async function createOrder(req: Request, res: Response) {
  const { packId } = createOrderSchema.parse(req.body);
  const order = await paymentService.createOrder(String(req.user!._id), packId);
  res.status(201).json(ApiResponse.ok('Order created', order));
}

export async function verifyPayment(req: Request, res: Response) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyPaymentSchema.parse(
    req.body,
  );
  const result = await paymentService.verifyAndCredit(
    String(req.user!._id),
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  );
  res.json(ApiResponse.ok('Payment verified', result));
}

/**
 * Razorpay webhook. Public (no auth) but signature-verified against the raw
 * body captured in app.ts. Always 200s on a valid signature so Razorpay does
 * not retry needlessly; the credit grant is idempotent.
 */
export async function webhook(req: Request, res: Response) {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (typeof signature !== 'string' || !rawBody) {
    throw new ApiError(400, 'Missing webhook signature');
  }
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const event = req.body as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };

  if (event.event === 'payment.captured') {
    const entity = event.payload?.payment?.entity;
    if (entity?.order_id && entity.id) {
      await paymentService.handlePaymentCaptured(entity.order_id, entity.id);
    }
  } else {
    logger.info({ event: event.event }, 'Unhandled Razorpay webhook event');
  }

  res.json(ApiResponse.ok('Webhook processed'));
}
