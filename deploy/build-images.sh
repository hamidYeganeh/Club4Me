#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

common_args=(
  --network=host
  -f Dockerfile.production
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:?NEXT_PUBLIC_API_URL is required}"
  --build-arg NEXT_PUBLIC_APPLICATION_URL="${NEXT_PUBLIC_APPLICATION_URL:-https://app.gym4me.ir}"
  --build-arg NEXT_PUBLIC_WEBSITE_URL="${NEXT_PUBLIC_WEBSITE_URL:-https://gym4me.ir}"
  --build-arg NEXT_PUBLIC_APP_RELEASE="${APP_RELEASE:-production}"
  --build-arg NEXT_PUBLIC_TINYMCE_API_KEY="${NEXT_PUBLIC_TINYMCE_API_KEY:-}"
  --build-arg NEXT_PUBLIC_NESHAN_MAP_KEY="${NEXT_PUBLIC_NESHAN_MAP_KEY:?NEXT_PUBLIC_NESHAN_MAP_KEY is required}"
  --build-arg NEXT_PUBLIC_SENTRY_DSN="${NEXT_PUBLIC_SENTRY_DSN:-}"
  --build-arg NEXT_PUBLIC_API_TIMEOUT_MS="${NEXT_PUBLIC_API_TIMEOUT_MS:-15000}"
  --build-arg NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}"
  .
)

docker build --target website -t club4me-website:latest "${common_args[@]}"
docker build --target application -t club4me-application:latest "${common_args[@]}"
docker build --target admin -t club4me-admin:latest "${common_args[@]}"
docker build --target business -t club4me-business:latest "${common_args[@]}"
docker build --target backend -t club4me-backend:latest "${common_args[@]}"
