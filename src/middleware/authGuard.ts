import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenHelpers';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const authGuard = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'No access token provided');
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  req.user = user;
  next();
});
