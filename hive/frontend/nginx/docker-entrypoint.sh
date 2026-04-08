#!/bin/sh
set -e

HTTPS_CONF="/etc/nginx/conf.d/https.conf"

echo "[entrypoint] Starting nginx with HTTP-only config..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Give nginx a moment to be ready (for ACME or initial traffic)
sleep 3

echo "[entrypoint] Loading HTTPS config..."
# Render the HTTPS config template (replace ${NGINX_APP0_DOMAIN})
envsubst '${NGINX_APP0_DOMAIN}' < /etc/nginx/templates/https.conf.template > "$HTTPS_CONF"

# Reload nginx to apply HTTPS immediately
nginx -s reload
echo "[entrypoint] nginx reloaded with HTTPS."

# Wait for nginx process so container stays alive
wait $NGINX_PID


# #!/bin/sh
# set -e

# CERT_PATH="/etc/letsencrypt/live/${NGINX_APP0_DOMAIN}/fullchain.pem"
# HTTPS_CONF="/etc/nginx/conf.d/https.conf"
# HTTP_CONF="/etc/nginx/conf.d/default.conf"

# echo "[entrypoint] Starting nginx with HTTP-only config..."
# nginx -g "daemon off;" &
# NGINX_PID=$!

# # Give nginx a moment to be ready for ACME challenges
# sleep 3

# if [ -f "$CERT_PATH" ]; then
#   echo "[entrypoint] Certificates found — loading HTTPS config..."
#   # Render the HTTPS config template (envsubst replaces ${NGINX_APP0_DOMAIN})
#   envsubst '${NGINX_APP0_DOMAIN}' < /etc/nginx/templates/https.conf.template > "$HTTPS_CONF"
#   nginx -s reload
#   echo "[entrypoint] nginx reloaded with HTTPS."
# else
#   echo "[entrypoint] No certificates found — staying on HTTP (dev mode or first run)."
# fi

# # Wait for nginx process
# wait $NGINX_PID