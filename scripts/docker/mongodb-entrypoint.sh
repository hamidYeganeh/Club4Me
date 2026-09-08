#!/bin/sh
set -eu
key=/data/db/.replica-key
if [ ! -s "$key" ]; then
  umask 077
  head -c 756 /dev/urandom | base64 | tr -d '\n' > "$key"
fi
chown mongodb:mongodb "$key"
chmod 400 "$key"
exec /usr/local/bin/docker-entrypoint.sh mongod --replSet rs0 --keyFile "$key" --bind_ip_all
