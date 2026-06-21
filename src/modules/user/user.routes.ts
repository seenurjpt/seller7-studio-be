import { Router } from 'express';
import * as userController from './user.controller';
import { authGuard } from '../../middleware/authGuard';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(authGuard);

router.get('/me', asyncHandler(userController.getMe));
router.patch('/me', asyncHandler(userController.updateMe));

export default router;
