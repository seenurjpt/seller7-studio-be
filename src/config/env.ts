import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  PORT: parseInt(optionalEnv('PORT', '4000'), 10),
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',

  MONGODB_URI: requireEnv('MONGODB_URI'),
  CLIENT_URL: optionalEnv('CLIENT_URL', 'http://localhost:3000'),
  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),

  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES: optionalEnv('JWT_ACCESS_EXPIRES', '15m'),
  JWT_REFRESH_EXPIRES: optionalEnv('JWT_REFRESH_EXPIRES', '7d'),

  RESET_TOKEN_EXPIRES_MIN: parseInt(optionalEnv('RESET_TOKEN_EXPIRES_MIN', '15'), 10),

  // Razorpay — optional at boot so the server still runs without payments
  // configured; the payment endpoints fail loudly if these are missing.
  RAZORPAY_KEY_ID: optionalEnv('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: optionalEnv('RAZORPAY_KEY_SECRET'),
  RAZORPAY_WEBHOOK_SECRET: optionalEnv('RAZORPAY_WEBHOOK_SECRET'),

  SMTP_HOST: optionalEnv('SMTP_HOST'),
  SMTP_PORT: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
  SMTP_USER: optionalEnv('SMTP_USER'),
  SMTP_PASS: optionalEnv('SMTP_PASS'),
  MAIL_FROM: optionalEnv('MAIL_FROM', 'Seller7 Studio <no-reply@seller7.studio>'),

  get isDev() { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production'; },
};
