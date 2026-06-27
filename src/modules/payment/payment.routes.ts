import { Router } from 'express';
import * as paymentController from './payment.controller';
import { authGuard } from '../../middleware/authGuard';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Public catalog
router.get('/packs', asyncHandler(paymentController.getPacks));

// Razorpay webhook — public, but verified against the raw body (captured by the
// JSON parser's verify hook in app.ts) using the webhook secret.
router.post('/webhook', asyncHandler(paymentController.webhook));

// Authenticated buyer endpoints
router.get('/balance', authGuard, asyncHandler(paymentController.getBalance));
router.get('/history', authGuard, asyncHandler(paymentController.getHistory));
router.post('/order', authGuard, asyncHandler(paymentController.createOrder));
router.post('/verify', authGuard, asyncHandler(paymentController.verifyPayment));

export default router;
