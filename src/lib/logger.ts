import pino from 'pino';
import { env } from '../config/env';

// pino-pretty transport uses worker_threads which are unavailable in serverless — dev only
const transport = env.isDev
  ? pino.transport({ target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } })
  : undefined;

export const logger = pino({ level: env.isDev ? 'debug' : 'info' }, transport);
