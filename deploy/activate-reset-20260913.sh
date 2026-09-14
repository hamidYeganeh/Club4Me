#!/usr/bin/env bash
set -euo pipefail
release=20260913-ui-reset
root=/opt/releases/$release
backup=/opt/club4me-backups/20260913-before-reset
cd /opt/club4me
compose=(docker compose --env-file .env.production -f compose.production.yml)
services=(backend website application admin business)
for service in "${services[@]}"; do
  docker image inspect "club4me-$service:$release" >/dev/null
  docker image inspect "club4me-$service:rollback-$release" >/dev/null
done
test -f "$root/REHEARSAL_PASSED"
cd "$backup"
sha256sum --check SHA256SUMS
cd /opt/club4me
reset_done=false
recover() {
  trap - ERR
  echo ACTIVATION_FAILED_RESTORING_PREVIOUS_RELEASE
  "${compose[@]}" stop backend
  cp "$root/rollback/.env.production" .env.production
  if [ "$reset_done" = true ]; then
    docker run --rm --network club4me_backend --env-file .env.production "club4me-backend:$release" \
      node -e 'const {MongoClient}=require("mongodb");(async()=>{const c=await MongoClient.connect(process.env.MONGODB_URL);await c.db("gym4me").dropDatabase();await c.close()})().catch(()=>process.exit(1))'
    docker exec -i club4me-mongodb-1 sh -c 'exec mongorestore --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip' < "$backup/mongodb-final.archive.gz"
    docker run --rm -i --user root -v club4me_media_data:/data/media "club4me-backend:$release" tar -xzf - -C /data/media < "$backup/media-final.tar.gz"
  fi
  "${compose[@]}" up -d --no-deps --wait --wait-timeout 180 "${services[@]}"
  docker exec club4me-gateway-1 nginx -s reload
  exit 1
}
trap recover ERR
"${compose[@]}" stop backend
# Capture a final consistent snapshot after writes and background jobs stop.
docker exec club4me-mongodb-1 sh -c 'exec mongodump --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db gym4me --archive --gzip' > "$backup/mongodb-final.archive.gz"
gzip -t "$backup/mongodb-final.archive.gz"
chmod 600 "$backup/mongodb-final.archive.gz"
docker run --rm --user root -v club4me_media_data:/data/media:ro "club4me-backend:$release" tar -czf - -C /data/media . > "$backup/media-final.tar.gz"
tar -tzf "$backup/media-final.tar.gz" >/dev/null
chmod 600 "$backup/media-final.tar.gz"
reset_done=true
docker run --rm --network club4me_backend --env-file .env.production \
  -e CONFIRM_RESET_DATABASE=gym4me -v "$root/source/deploy:/tmp:ro" \
  "club4me-backend:$release" node /tmp/reset-scenarios.cjs --replace-all > "$root/reset-result.json"
docker exec club4me-redis-1 sh -c 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli FLUSHALL' >/dev/null
# Old uploads were backed up above and have no references in the new dataset.
docker run --rm --user root -v club4me_media_data:/data/media "club4me-backend:$release" \
  node -e 'const fs=require("node:fs"); for(const name of fs.readdirSync("/data/media")) fs.rmSync("/data/media/"+name,{recursive:true,force:true});'
python3 - <<'PY'
from pathlib import Path
p=Path('.env.production')
values={'APP_RELEASE':'20260913-ui-reset','NEXT_PUBLIC_APP_RELEASE':'20260913-ui-reset'}
for service in ['backend','website','application','admin','business']:
    values['CLUB4ME_'+service.upper()+'_IMAGE']='club4me-'+service+':20260913-ui-reset'
lines=[line for line in p.read_text().splitlines() if line.split('=',1)[0] not in values]
p.write_text('\n'.join(lines+[key+'='+value for key,value in values.items()])+'\n')
PY
"${compose[@]}" up -d --no-deps --wait --wait-timeout 180 "${services[@]}"
docker exec club4me-gateway-1 nginx -t
docker exec club4me-gateway-1 nginx -s reload
printf '%s\n' "$release" > .deployed-revision
echo ACTIVATION_COMPLETE
