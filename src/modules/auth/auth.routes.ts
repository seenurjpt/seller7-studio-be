import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import { authGuard } from '../../middleware/authGuard';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation';
import {
  authLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../../middleware/rateLimiters';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(authController.signup));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', authGuard, asyncHandler(authController.logout));
router.post('/refresh', asyncHandler(authController.refresh));
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
router.post(
  '/change-password',
  authGuard,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);

export default router;
