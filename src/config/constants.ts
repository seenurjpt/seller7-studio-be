export const COOKIE_REFRESH_TOKEN = 'refreshToken';

export const BCRYPT_ROUNDS = 12;

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};
