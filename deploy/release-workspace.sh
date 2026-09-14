#!/usr/bin/env bash
# Run on the VPS against an uploaded git archive. Builds before changing live services.
set -euo pipefail
release=${1:?release name required}
revision=${2:?git revision required}
[[ "$release" =~ ^[a-zA-Z0-9-]+$ ]] || exit 2
[[ "$revision" =~ ^[a-f0-9]{40}$ ]] || exit 2
release_root=/opt/releases/$release
live_root=/opt/club4me
mkdir -p "$release_root/rollback"
chmod 700 "$release_root/rollback"
cp "$live_root/.env.production" "$release_root/rollback/.env.production"
cp "$live_root/compose.production.yml" "$release_root/rollback/compose.production.yml"
cd "$release_root/source"
# Values stay on the VPS; only public build configuration is passed to Docker.
python3 - "$release" "$live_root/.env.production" <<'PY'
import os,sys,subprocess
from pathlib import Path
release,env_path=sys.argv[1:]
values={}
for line in Path(env_path).read_text().splitlines():
 if line and not line.startswith('#') and '=' in line:
  key,value=line.split('=',1);values[key]=value.strip().strip('"').strip("'")
defaults={'NEXT_PUBLIC_API_URL':'https://api.gym4me.ir/api/v1','NEXT_PUBLIC_APPLICATION_URL':'https://app.gym4me.ir','NEXT_PUBLIC_WEBSITE_URL':'https://gym4me.ir','NEXT_PUBLIC_API_TIMEOUT_MS':'15000','NEXT_PUBLIC_BASE_PATH':''}
keys=[*defaults,'NEXT_PUBLIC_NESHAN_MAP_KEY','NEXT_PUBLIC_TINYMCE_API_KEY','NEXT_PUBLIC_SENTRY_DSN']
args=[]
for key in keys: args+=['--build-arg',key+'='+values.get(key,defaults.get(key,''))]
args+=['--build-arg','NEXT_PUBLIC_APP_RELEASE='+release]
for service in ['backend','website','application','admin','business']:
 print('BUILDING '+service,flush=True)
 with open('../build-'+service+'.log','w') as log:
  subprocess.run(['docker','build','--network=host','-f','Dockerfile.production','--target',service,'-t','club4me-'+service+':'+release,*args,'.'],stdout=log,stderr=subprocess.STDOUT,check=True)
 print('BUILT '+service,flush=True)
PY
printf '%s\n' "$revision" > "$release_root/BUILD_REVISION"
cd "$live_root"
compose=(docker compose --env-file .env.production -f compose.production.yml)
services=(backend website application admin business)
rollback() {
  trap - ERR
  cp "$release_root/rollback/.env.production" .env.production
  cp "$release_root/rollback/compose.production.yml" compose.production.yml
  "${compose[@]}" up -d --no-deps --wait --wait-timeout 180 "${services[@]}"
  docker exec club4me-gateway-1 nginx -s reload
  echo ACTIVATION_FAILED_PREVIOUS_IMAGES_RESTORED
  exit 1
}
trap rollback ERR
python3 - "$release" <<'PY'
from pathlib import Path
import sys
release=sys.argv[1]
p=Path('.env.production');values={'APP_RELEASE':release,'NEXT_PUBLIC_APP_RELEASE':release}
for service in ['backend','website','application','admin','business']:
 values['CLUB4ME_'+service.upper()+'_IMAGE']='club4me-'+service+':'+release
lines=[]
for line in p.read_text().splitlines():
 key=line.split('=',1)[0]
 lines.append(key+'='+values.pop(key) if key in values else line)
lines += [k+'='+v for k,v in values.items()]
p.write_text('\n'.join(lines)+'\n')
PY
cp "$release_root/source/compose.production.yml" compose.production.yml
"${compose[@]}" config --quiet
"${compose[@]}" up -d --no-deps --wait --wait-timeout 180 "${services[@]}"
docker exec club4me-gateway-1 nginx -t
docker exec club4me-gateway-1 nginx -s reload
for host in gym4me.ir app.gym4me.ir admin.gym4me.ir business.gym4me.ir; do
  curl --fail --silent --show-error --retry 3 --output /dev/null "https://$host/"
  echo "HTTPS_OK $host"
done
curl --fail --silent --show-error --retry 3 --output /dev/null https://api.gym4me.ir/health/ready
printf '%s\n' "$revision" > .deployed-revision
printf '%s\n' "$revision" > "$release_root/DEPLOYED_REVISION"
echo RELEASE_HEALTHY
