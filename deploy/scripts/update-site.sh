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

# Frontend build policy: this script expects a prebuilt frontend at $APP_DIR/frontend/.next
if [[ -n "${FRONTEND_TARBALL:-}" ]]; then
  TBALL="$FRONTEND_TARBALL"
  if [[ -f "$TBALL" ]]; then
    echo "Found FRONTEND_TARBALL=$TBALL — extracting into $APP_DIR/frontend"
    mkdir -p "$APP_DIR/frontend"
    tar -xzf "$TBALL" -C "$APP_DIR/frontend"
    chown -R "$USER":"$USER" "$APP_DIR/frontend"
  else
    echo "FRONTEND_TARBALL set but file not found: $TBALL" >&2
    exit 1
  fi
fi

if [[ -d "$APP_DIR/frontend/.next" ]]; then
  echo "Prebuilt frontend detected at $APP_DIR/frontend/.next — skipping build"
else
  echo "No prebuilt frontend found at $APP_DIR/frontend/.next"
  echo "Please build the frontend locally and upload the frontend/.next and public/ directories to the server. See DEPLOYMENT.md for rsync examples."
fi

echo "Starting/restarting backend process with PM2"
if npx --yes pm2 describe snap2eat-backend >/dev/null 2>&1; then
  npx --yes pm2 restart snap2eat-backend --update-env
else
  npx --yes pm2 start node --name snap2eat-backend --cwd "$APP_DIR/backend" -- src/server.js --update-env
fi

echo "Starting/restarting frontend process with PM2"
if [[ -d "$APP_DIR/frontend/.next" ]]; then
  if npx --yes pm2 describe snap2eat-frontend >/dev/null 2>&1; then
    npx --yes pm2 restart snap2eat-frontend --update-env
  else
    npx --yes pm2 start npm --name snap2eat-frontend --cwd "$APP_DIR/frontend" -- start
  fi
else
  echo "Skipping frontend pm2 restart because no prebuilt frontend is present"
fi

npx --yes pm2 save || true

echo "Update finished. PM2 status:"
npx --yes pm2 status
