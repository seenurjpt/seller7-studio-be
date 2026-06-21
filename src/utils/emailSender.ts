import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../lib/logger';

async function createTransport() {
  // In dev with no SMTP credentials, create an Ethereal test account and log to console.
  if (env.isDev && !env.SMTP_USER) {
    const testAccount = await nodemailer.createTestAccount();
    const transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    return { transport, isEthereal: true };
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return { transport, isEthereal: false };
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const { transport, isEthereal } = await createTransport();

  const info = await transport.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: 'Reset your Seller7 Studio password',
    text: `Click the link below to reset your password. It expires in ${env.RESET_TOKEN_EXPIRES_MIN} minutes.\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
    html: `
      <p>Click the link below to reset your password. It expires in <strong>${env.RESET_TOKEN_EXPIRES_MIN} minutes</strong>.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });

  if (isEthereal) {
    logger.info(
      { previewUrl: nodemailer.getTestMessageUrl(info) },
      `[DEV] Password reset email preview URL — reset link: ${resetLink}`,
    );
  }
}
