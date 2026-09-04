#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

common_args=(
  --network=host
  -f Dockerfile.production
  --build-arg NEXT_PUBLIC_APP_RELEASE="${APP_RELEASE:-production}"
  .
)

docker build --target website -t club4me-website:latest "${common_args[@]}"
docker build --target application -t club4me-application:latest "${common_args[@]}"
docker build --target admin -t club4me-admin:latest "${common_args[@]}"
docker build --target business -t club4me-business:latest "${common_args[@]}"
docker build --network=host --target backend -t club4me-backend:latest -f Dockerfile.production .
