import type { IncomingMessage, ServerResponse } from 'http';
import { connectDB } from './lib/db';
import app from './app';

let dbReady: Promise<void> | null = null;

function ensureDB() {
  if (!dbReady) {
    dbReady = connectDB().catch((err) => {
      dbReady = null;
      throw err;
    });
  }
  return dbReady;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureDB();
  return app(req, res);
}
