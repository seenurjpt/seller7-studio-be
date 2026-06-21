import { Request, Response } from 'express';
import * as userService from './user.service';
import { ApiResponse } from '../../utils/ApiResponse';

export async function getMe(req: Request, res: Response) {
  const user = await userService.getMe(String(req.user!._id));
  res.json(ApiResponse.ok('Profile fetched', user));
}

export async function updateMe(req: Request, res: Response) {
  const updates = userService.updateProfileSchema.parse(req.body);
  const user = await userService.updateProfile(String(req.user!._id), updates);
  res.json(ApiResponse.ok('Profile updated', user));
}
