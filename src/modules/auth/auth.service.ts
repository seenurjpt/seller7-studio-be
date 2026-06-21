import { User, IUserDocument } from '../../models/user.model';
import { ApiError } from '../../utils/ApiError';
import {
  issueTokenPair,
  hashToken,
  generateResetToken,
  verifyRefreshToken,
} from '../../utils/tokenHelpers';
import { sendPasswordResetEmail } from '../../utils/emailSender';
import { env } from '../../config/env';
import { TokenPair, SafeUser } from '../../types/auth.types';

function toSafeUser(user: IUserDocument): SafeUser {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: (user as unknown as { createdAt: Date }).createdAt,
    updatedAt: (user as unknown as { updatedAt: Date }).updatedAt,
  };
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<{ tokens: TokenPair; user: SafeUser }> {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });

  const tokens = issueTokenPair(String(user._id), user.email);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return { tokens, user: toSafeUser(user) };
}

export async function login(
  email: string,
  password: string,
): Promise<{ tokens: TokenPair; user: SafeUser }> {
  const user = await User.findOne({ email }).select('+password +refreshTokenHash');
  const genericError = new ApiError(401, 'Invalid email or password');

  if (!user) throw genericError;
  const match = await user.comparePassword(password);
  if (!match) throw genericError;

  const tokens = issueTokenPair(String(user._id), user.email);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return { tokens, user: toSafeUser(user) };
}

export async function logout(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '' } });
}

export async function refreshTokens(
  rawRefreshToken: string,
): Promise<{ tokens: TokenPair; user: SafeUser }> {
  const payload = verifyRefreshToken(rawRefreshToken);
  const user = await User.findById(payload.sub).select('+refreshTokenHash');

  if (!user || !user.refreshTokenHash) {
    throw new ApiError(401, 'Session not found, please log in again');
  }

  const incoming = hashToken(rawRefreshToken);
  if (incoming !== user.refreshTokenHash) {
    // Reuse detected — invalidate the session
    user.refreshTokenHash = undefined;
    await user.save();
    throw new ApiError(401, 'Token reuse detected, please log in again');
  }

  const tokens = issueTokenPair(String(user._id), user.email);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return { tokens, user: toSafeUser(user) };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return; // Don't reveal whether account exists

  const { raw, hash } = generateResetToken();
  const expires = new Date(Date.now() + env.RESET_TOKEN_EXPIRES_MIN * 60 * 1000);

  user.passwordResetTokenHash = hash;
  user.passwordResetExpires = expires;
  await user.save();

  const resetLink = `${env.CLIENT_URL}/reset-password?token=${raw}`;
  await sendPasswordResetEmail(email, resetLink);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const hash = hashToken(rawToken);

  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires +refreshTokenHash');

  if (!user) throw new ApiError(400, 'Reset token is invalid or has expired');

  user.password = newPassword;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined; // invalidate existing sessions
  await user.save();
}
