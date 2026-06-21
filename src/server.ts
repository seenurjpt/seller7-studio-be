import { env } from './config/env';
import { connectDB } from './lib/db';
import { logger } from './lib/logger';
import app from './app';

async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info('Endpoints ready:');
    logger.info('  GET  /api/v1/health');
    logger.info('  POST /api/v1/auth/signup');
    logger.info('  POST /api/v1/auth/login');
    logger.info('  POST /api/v1/auth/logout');
    logger.info('  POST /api/v1/auth/refresh');
    logger.info('  POST /api/v1/auth/forgot-password');
    logger.info('  POST /api/v1/auth/reset-password');
    logger.info('  GET  /api/v1/users/me');
    logger.info('  PATCH /api/v1/users/me');
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      const { disconnectDB } = await import('./lib/db');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

start().catch((err) => {
  // env or db failure before logger is fully ready — use console as fallback
  console.error('Fatal startup error:', err);
  process.exit(1);
});
