# Seller7 Studio — Backend

Node.js + Express + TypeScript + MongoDB backend for the Seller7 Studio AI product-image SaaS.

## Stack

- **Runtime**: Node.js LTS + Express
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (short-lived access + long-lived refresh with rotation)
- **Validation**: Zod
- **Email**: Nodemailer (Ethereal in dev, configurable SMTP in prod)
- **Security**: Helmet, CORS, express-rate-limit, bcryptjs
- **Logging**: Pino + pino-pretty (dev) / JSON (prod)

---

## Setup

### 1. Prerequisites

- Node.js 20+ (LTS)
- A MongoDB instance (local or Atlas)

### 2. Install

```bash
cd seller7-studio-be
npm install
```

### 3. Environment

```bash
cp .env.example .env
# Edit .env — at minimum set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

See [Environment Variables](#environment-variables) for all keys.

### 4. Run

```bash
# Development (hot-reload via ts-node-dev)
npm run dev

# Production build
npm run build
npm start

# Type check only
npm run typecheck
```

The server starts on `PORT` (default `4000`) and logs all endpoints on boot.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `4000` | HTTP port |
| `NODE_ENV` | no | `development` | `development` / `production` |
| `MONGODB_URI` | **yes** | — | MongoDB connection string |
| `CLIENT_URL` | no | `http://localhost:3000` | Frontend URL (used in reset-password links) |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Allowed CORS origin |
| `JWT_ACCESS_SECRET` | **yes** | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | **yes** | — | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES` | no | `15m` | Access token TTL (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES` | no | `7d` | Refresh token TTL (e.g. `7d`, `30d`) |
| `RESET_TOKEN_EXPIRES_MIN` | no | `15` | Password reset token expiry in minutes |
| `SMTP_HOST` | no | — | SMTP host (leave blank in dev to use Ethereal) |
| `SMTP_PORT` | no | `587` | SMTP port |
| `SMTP_USER` | no | — | SMTP username |
| `SMTP_PASS` | no | — | SMTP password |
| `MAIL_FROM` | no | `Seller7 Studio <no-reply@seller7.studio>` | Sender address |

**Dev email**: When `SMTP_USER` is empty in development, Nodemailer creates an [Ethereal](https://ethereal.email) test account automatically and logs a preview URL to the console.

---

## Project Structure

```
src/
  config/        env loading + constants
  lib/           db connection, logger, queue stub (future)
  models/        Mongoose schemas
  modules/
    auth/        auth.routes, auth.controller, auth.service, auth.validation
    user/        user.routes, user.controller, user.service
  middleware/    authGuard, errorHandler, validate(zodSchema), rateLimiters, notFound
  utils/         tokenHelpers, emailSender, asyncHandler, ApiError, ApiResponse
  types/         shared TS types + Express augmentation
  app.ts         Express app wiring
  server.ts      DB connect + server start
```

---

## API Endpoints

Base: `http://localhost:4000/api/v1`

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Server health check |

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | — | Create account, returns access token + sets refresh cookie |
| `POST` | `/auth/login` | — | Login, returns access token + sets refresh cookie |
| `POST` | `/auth/logout` | Bearer | Clear session |
| `POST` | `/auth/refresh` | Cookie | Rotate tokens using httpOnly refresh cookie |
| `POST` | `/auth/forgot-password` | — | Send password reset email |
| `POST` | `/auth/reset-password` | — | Reset password with token from email |

### User — `/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | Bearer | Get authenticated user profile |
| `PATCH` | `/users/me` | Bearer | Update name |

---

## Request / Response Examples

### POST /api/v1/auth/signup

**Request**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "accessToken": "<JWT>",
    "user": {
      "_id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "isEmailVerified": false,
      "createdAt": "2026-06-20T00:00:00.000Z",
      "updatedAt": "2026-06-20T00:00:00.000Z"
    }
  }
}
```

**Errors**: `409` email exists · `422` validation failed

---

### POST /api/v1/auth/login

**Request**
```json
{ "email": "jane@example.com", "password": "SecurePass1" }
```

**Response 200** — same shape as signup, with `"message": "Logged in successfully"`.

**Error 401**: `"Invalid email or password"` (generic — doesn't reveal which field is wrong)

---

### POST /api/v1/auth/logout

**Header**: `Authorization: Bearer <accessToken>`

**Response 200**
```json
{ "success": true, "message": "Logged out successfully", "data": null }
```

---

### POST /api/v1/auth/refresh

Reads refresh token from `refreshToken` httpOnly cookie.

**Response 200**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": { "accessToken": "<new JWT>", "user": { ... } }
}
```

**Error 401**: token reuse detected → session invalidated, must re-login.

---

### POST /api/v1/auth/forgot-password

**Request**
```json
{ "email": "jane@example.com" }
```

**Response 200** (same whether email exists or not)
```json
{
  "success": true,
  "message": "If an account with that email exists, a reset link has been sent.",
  "data": null
}
```

In dev, the reset link is logged to console.

---

### POST /api/v1/auth/reset-password

**Request**
```json
{ "token": "<raw token from email link>", "newPassword": "NewPass99" }
```

**Response 200**
```json
{ "success": true, "message": "Password reset successfully. Please log in with your new password.", "data": null }
```

**Error 400**: token invalid or expired.

---

### GET /api/v1/users/me

**Header**: `Authorization: Bearer <accessToken>`

**Response 200**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "_id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "isEmailVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Security Notes

- Passwords hashed with bcrypt (cost factor 12).
- Access tokens: 15 min TTL. Refresh tokens: 7 day TTL.
- Refresh tokens stored as SHA-256 hash only; rotated on every use; reuse triggers session invalidation.
- Password reset tokens: SHA-256 hash stored, single-use, 15 min expiry.
- All auth routes rate-limited (login/signup: 20/15min; forgot-password: 5/hour).
- Generic error messages on login and forgot-password to prevent user enumeration.
- `password`, `refreshTokenHash`, `passwordResetTokenHash` fields never included in JSON responses (toJSON transform + `select: false`).
