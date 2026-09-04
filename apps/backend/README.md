# Gym4Me Backend

NestJS modular API with MongoDB, Redis, and JWT. Discovery routes remain on the existing Hono adapter.

## Env

Copy `.env.example` to `.env`:

```bash
PORT=7088
MONGODB_URL=mongodb://localhost:27017/gym4me
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
KAVENEGAR_API_KEY=
KAVENEGAR_OTP_TEMPLATE=verify
CORS_ORIGINS=http://localhost:7080,http://localhost:7081,http://localhost:7082,http://localhost:7083
```

Create a Kavenegar lookup template (for example `verify`) whose `%token` placeholder receives the 5-digit OTP. In development, SMS sending is skipped when `KAVENEGAR_API_KEY` is empty and the code is logged instead.

## Scripts

```bash
npm run dev     # http://localhost:7088
npm run build
npm run start
npm run test
```

## Versioning

Public HTTP APIs are mounted at `/api/{version}/{domain}/{feature}` with standard REST methods.

Current version: `v1`.

```
GET  /api                         # supported versions
GET  /health                      # unversioned liveness

POST /api/v1/account/auth/otp
POST /api/v1/account/auth/otp/confirm
POST /api/v1/account/auth/login
POST /api/v1/account/auth/set-password
POST /api/v1/account/auth/forgot-password
POST /api/v1/account/auth/forgot-password/confirm
POST /api/v1/account/auth/refresh
POST /api/v1/account/auth/logout
GET  /api/v1/account/me

GET  /api/v1/discovery/clubs
POST /api/v1/discovery/clubs
GET  /api/v1/discovery/clubs/:clubId
GET  /api/v1/discovery/clubs/:clubId/classes
POST /api/v1/discovery/clubs/:clubId/classes
GET  /api/v1/discovery/clubs/:clubId/slots
POST /api/v1/discovery/clubs/:clubId/slots
POST /api/v1/discovery/clubs/:clubId/slots/reserve
```

Successful responses use `{ data, meta: { version } }`. Errors use `{ error: { code, message, details? } }`.

Phone numbers are accepted as `+989383729627`, `09383729627`, or `9383729627` and stored as E.164 (`+98...`). `phone_number` is accepted as an alias of `phone`.
