#!/usr/bin/env bash
set -euo pipefail

# Update the site on the server. Intended to be run on the server after code is present
# Usage: sudo /var/www/snap2eat/deploy/scripts/update-site.sh

APP_DIR="${APP_DIR:-/var/www/snap2eat}"
USER="${USER:-ubuntu}"
BRANCH="${BRANCH:-main}"

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run with sudo." >&2
  exec sudo -E bash "$0" "$@"
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "App directory $APP_DIR does not exist." >&2
  exit 1
fi

echo "Fetching latest code (branch: $BRANCH)"
sudo -u "$USER" git -C "$APP_DIR" fetch --all --prune || true
sudo -u "$USER" git -C "$APP_DIR" checkout "$BRANCH" || true
sudo -u "$USER" git -C "$APP_DIR" pull origin "$BRANCH" || true

echo "Installing backend dependencies"
npm ci --prefix "$APP_DIR/backend" --omit=dev

echo "Installing frontend dependencies and building"
npm ci --prefix "$APP_DIR/frontend"
npm run build --prefix "$APP_DIR/frontend"

echo "Starting/restarting backend process with PM2"
if npx --yes pm2 describe snap2eat-backend >/dev/null 2>&1; then
  npx --yes pm2 restart snap2eat-backend --update-env
else
  npx --yes pm2 start node --name snap2eat-backend --cwd "$APP_DIR/backend" -- src/server.js --update-env
fi

echo "Starting/restarting frontend process with PM2"
if npx --yes pm2 describe snap2eat-frontend >/dev/null 2>&1; then
  npx --yes pm2 restart snap2eat-frontend --update-env
else
  npx --yes pm2 start npm --name snap2eat-frontend --cwd "$APP_DIR/frontend" -- start
fi

npx --yes pm2 save || true

echo "Update finished. PM2 status:"
npx --yes pm2 status
