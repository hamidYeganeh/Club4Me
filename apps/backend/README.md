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
CORS_ORIGINS=http://localhost:7080,http://localhost:7081,http://localhost:7082,http://localhost:7083,http://localhost:7091,http://127.0.0.1:7080,http://127.0.0.1:7081,http://127.0.0.1:7082,http://127.0.0.1:7083,http://127.0.0.1:7091
```

The API reflects every requesting origin in every environment so debug apps,
emulators, physical devices, live-reload servers, and external web clients can
use it without an origin allowlist. `CORS_ORIGINS` is retained for deployment
compatibility but is not used to reject requests.

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

### Media uploads

Clients upload a `file` multipart field to `POST /api/v1/media/upload` (or
`/api/v1/business/media/upload`) with a bearer token. The shared API media client
connects the application, admin, and business uploaders to this endpoint.
Images (JPEG, PNG, WebP, GIF, AVIF) and videos (MP4, QuickTime, WebM) up to 10 MiB
are accepted; SVG and other active document formats are rejected. File signatures
must match the declared MIME type. MongoDB stores metadata, a storage key, and a
URL; bytes are stored in `MEDIA_LOCAL_DIR`.

Set `MEDIA_PUBLIC_BASE_URL` to the externally reachable backend origin, e.g.
`https://api.example.com`, and mount a persistent volume at `MEDIA_LOCAL_DIR`
(default `.artifacts/media`). Multiple backend instances must share that volume.
Back up this directory together with MongoDB. Proxy `/media/:id/file` to the
backend, as well as `/api/`; public image/video requests need no bearer token.
Delivery supports HTTP ranges and revalidation and refuses blocked media.

`POST /api/v1/media` still registers external HTTP(S) URLs. For compatibility,
legacy base64 requests to that endpoint are decoded into files before saving.
Existing inline records in the media collection are converted on media reads;
previously copied base64 values in other collections are not bulk-migrated by
this change. New profile, article, discovery, and resource image values must use
URLs. Local crop previews may still use in-memory data URLs.
