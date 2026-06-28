import { Request, Response } from 'express';
import * as authService from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { COOKIE_REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS } from '../../config/constants';
import { env } from '../../config/env';

function setRefreshCookie(res: Response, refreshToken: string) {
  // Convert JWT duration string to ms for maxAge
  const days = parseInt(env.JWT_REFRESH_EXPIRES, 10);
  const maxAge = (isNaN(days) ? 7 : days) * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_REFRESH_TOKEN, refreshToken, { ...REFRESH_COOKIE_OPTIONS, maxAge });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS);
}

export async function signup(req: Request, res: Response) {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const { tokens, user } = await authService.signup(name, email, password);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(201).json(
    ApiResponse.ok('Account created successfully', { accessToken: tokens.accessToken, user }),
  );
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const { tokens, user } = await authService.login(email, password);
  setRefreshCookie(res, tokens.refreshToken);
  res.json(ApiResponse.ok('Logged in successfully', { accessToken: tokens.accessToken, user }));
}

export async function logout(req: Request, res: Response) {
  await authService.logout(String(req.user!._id));
  clearRefreshCookie(res);
  res.json(ApiResponse.ok('Logged out successfully'));
}

export async function refresh(req: Request, res: Response) {
  const rawRefreshToken: string | undefined = req.cookies[COOKIE_REFRESH_TOKEN];
  if (!rawRefreshToken) {
    res.status(401).json(ApiResponse.fail('No refresh token'));
    return;
  }
  const { tokens, user } = await authService.refreshTokens(rawRefreshToken);
  setRefreshCookie(res, tokens.refreshToken);
  res.json(ApiResponse.ok('Token refreshed', { accessToken: tokens.accessToken, user }));
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  // Always same message — don't reveal account existence
  res.json(ApiResponse.ok('If an account with that email exists, a reset link has been sent.'));
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  await authService.resetPassword(token, newPassword);
  res.json(ApiResponse.ok('Password reset successfully. Please log in with your new password.'));
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  await authService.changePassword(String(req.user!._id), currentPassword, newPassword);
  res.json(ApiResponse.ok('Password changed successfully'));
}
