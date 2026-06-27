export const COOKIE_REFRESH_TOKEN = 'refreshToken';

export const BCRYPT_ROUNDS = 12;

const isProd = process.env.NODE_ENV === 'production';

// In production the frontend and API live on different sites (e.g. separate
// *.vercel.app subdomains, which are cross-site under the Public Suffix List),
// so the refresh cookie must be SameSite=None + Secure to be sent at all.
// Locally everything is same-site over http, where Lax works and Secure must
// stay off (browsers drop Secure cookies on http).
export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  path: '/',
};
