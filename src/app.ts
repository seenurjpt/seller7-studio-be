import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import { ApiResponse } from './utils/ApiResponse';

const app = express();

// Security
app.use(helmet());

// Allowed browser origins. The wildcard '*' cannot be used together with
// credentials, so we reflect the request origin when it is in this allowlist.
const allowedOrigins = [
  'http://localhost:3000',
  'https://seller7-studio.vercel.app',
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, server-to-server) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

// Logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check (no auth, no rate limit)
app.get('/api/v1/health', (_req, res) => {
  res.json(ApiResponse.ok('Server is running'));
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// 404 + error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
