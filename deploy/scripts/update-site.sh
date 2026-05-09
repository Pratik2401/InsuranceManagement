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

if [[ -d "$APP_DIR/frontend/.next/standalone" ]]; then
  echo "Detected Next standalone build at $APP_DIR/frontend/.next/standalone"
  FRONTEND_MODE="standalone"

  # Next standalone expects static assets and public files alongside server.js.
  if [[ -d "$APP_DIR/frontend/.next/static" ]]; then
    mkdir -p "$APP_DIR/frontend/.next/standalone/.next"
    rm -rf "$APP_DIR/frontend/.next/standalone/.next/static"
    cp -a "$APP_DIR/frontend/.next/static" "$APP_DIR/frontend/.next/standalone/.next/static"
  fi

  if [[ -d "$APP_DIR/frontend/public" ]]; then
    rm -rf "$APP_DIR/frontend/.next/standalone/public"
    cp -a "$APP_DIR/frontend/public" "$APP_DIR/frontend/.next/standalone/public"
  fi
else
  echo "No standalone bundle found at $APP_DIR/frontend/.next/standalone"
  echo "Upload the standalone build from your local machine:"
  echo "  frontend/.next/standalone/"
  echo "  frontend/.next/static/"
  echo "  frontend/public/"
  echo "Skipping frontend start to avoid requiring 'next' on the server."
  FRONTEND_MODE="missing"
fi

if [[ "$FRONTEND_MODE" == "missing" ]]; then
  echo "Frontend bundle is incomplete; aborting update."
  exit 1
fi

if [[ "$FRONTEND_MODE" == "standalone" ]]; then
  :
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
if npx --yes pm2 describe snap2eat-frontend >/dev/null 2>&1; then
  npx --yes pm2 delete snap2eat-frontend || true
fi
npx --yes pm2 start bash --name snap2eat-frontend --cwd "$APP_DIR/frontend/.next/standalone" -- -lc 'set -a; if [ -f ../.env ]; then . ../.env; elif [ -f ./.env ]; then . ./.env; fi; set +a; exec node server.js' --update-env || true

npx --yes pm2 save || true

echo "Update finished. PM2 status:"
npx --yes pm2 status
