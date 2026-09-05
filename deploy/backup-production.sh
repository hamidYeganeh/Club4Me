#!/bin/sh
set -eu

BACKUP_ROOT=/opt/club4me-backups/daily
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TARGET="$BACKUP_ROOT/$STAMP"
LOCK=/run/lock/club4me-backup.lock

mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"

exec 9>"$LOCK"
flock -n 9 || exit 0

mkdir "$TARGET"
chmod 700 "$TARGET"

cleanup() {
  if [ -d "$TARGET" ] && [ ! -f "$TARGET/COMPLETE" ]; then
    find "$TARGET" -mindepth 1 -delete
    rmdir "$TARGET"
  fi
}
trap cleanup EXIT INT TERM

/usr/bin/docker exec club4me-mongodb-1 sh -c '
  exec mongodump \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --archive --gzip
' >"$TARGET/mongodb.archive.gz"

/usr/bin/docker exec club4me-redis-1 sh -c '
  REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli --no-auth-warning SAVE >/dev/null
'
/usr/bin/docker cp club4me-redis-1:/data/dump.rdb "$TARGET/redis-dump.rdb"
gzip "$TARGET/redis-dump.rdb"

gzip -t "$TARGET/mongodb.archive.gz"
gzip -t "$TARGET/redis-dump.rdb.gz"
sha256sum "$TARGET/mongodb.archive.gz" "$TARGET/redis-dump.rdb.gz" \
  >"$TARGET/SHA256SUMS"
chmod 600 "$TARGET"/*
touch "$TARGET/COMPLETE"
chmod 600 "$TARGET/COMPLETE"

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +14 \
  -exec sh -c 'for directory do find "$directory" -mindepth 1 -delete; rmdir "$directory"; done' sh {} +

trap - EXIT INT TERM
echo "backup_complete=$TARGET"
