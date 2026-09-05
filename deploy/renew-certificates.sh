#!/bin/sh
set -eu

/usr/bin/docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v /opt/gym4me-runtime/acme:/var/www/certbot \
  certbot/certbot:latest renew --webroot -w /var/www/certbot --quiet

/usr/bin/docker exec club4me-gateway-1 nginx -t
/usr/bin/docker exec club4me-gateway-1 nginx -s reload
