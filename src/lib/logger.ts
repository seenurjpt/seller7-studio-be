import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.isDev ? 'debug' : 'info',
  transport: env.isDev
    ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } }
    : undefined,
});
