#!/usr/bin/env bash
set -euo pipefail

# First-time deployment helper for the server.
# Usage: sudo REPO_URL=<git-url> BRANCH=main /path/to/first-deploy.sh

APP_DIR="${APP_DIR:-/var/www/snap2eat}"
REPO_URL="${REPO_URL:-}" # must be provided or repository should already exist at APP_DIR
BRANCH="${BRANCH:-main}"
USER="${USER:-ubuntu}"

if [[ $EUID -ne 0 ]]; then
  echo "This script should be run with sudo or as root. Re-running with sudo..."
  exec sudo -E bash "$0" "$@"
fi

if [[ -z "$REPO_URL" && ! -d "$APP_DIR/.git" ]]; then
  echo "ERROR: REPO_URL not provided and $APP_DIR is not a git repo. Export REPO_URL before running."
  exit 1
fi

mkdir -p "$APP_DIR"
chown -R "$USER":"$USER" "$APP_DIR"

if [[ -n "$REPO_URL" && ! -d "$APP_DIR/.git" ]]; then
  echo "Cloning repo $REPO_URL into $APP_DIR"
  sudo -u "$USER" git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  echo "Repository already present at $APP_DIR — fetching latest $BRANCH"
  sudo -u "$USER" git -C "$APP_DIR" fetch --all --prune || true
  sudo -u "$USER" git -C "$APP_DIR" checkout "$BRANCH" || true
  sudo -u "$USER" git -C "$APP_DIR" pull origin "$BRANCH" || true
fi

echo "Running system bootstrap (install packages, MySQL, Node, PM2)..."
if [[ -f "$APP_DIR/deploy/scripts/setup-server.sh" ]]; then
  bash "$APP_DIR/deploy/scripts/setup-server.sh"
else
  echo "Warning: setup-server.sh not found in repo. Please run it manually."
fi

NGINX_SRC="$APP_DIR/deploy/nginx/snap2eat.in.conf"
if [[ -f "$NGINX_SRC" ]]; then
  echo "Installing nginx site configuration"
  cp "$NGINX_SRC" /etc/nginx/sites-available/snap2eat.in
  ln -sf /etc/nginx/sites-available/snap2eat.in /etc/nginx/sites-enabled/snap2eat.in
  nginx -t && systemctl reload nginx
fi

ENV_FILE="$APP_DIR/backend/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Creating sample backend/.env (please edit with production secrets)"
  cat > "$ENV_FILE" <<'EOF'
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=insurance_app
DB_PASSWORD=change_me
DB_NAME=insurance_management
JWT_SECRET=change_this_to_a_strong_random_secret_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://snap2eat.in
EOF
  chown "$USER":"$USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  echo "$ENV_FILE already exists — not overwriting"
fi

echo "Configuring PM2 startup for $USER"
# Configure PM2 for the non-root user
sudo -u "$USER" bash -lc 'npx --yes pm2 startup systemd -u "$USER" --hp "/home/$USER"' || true

echo "Performing initial site update (install/build/start)"
"$APP_DIR/deploy/scripts/update-site.sh" || true

echo "First-time deployment finished. Verify processes and edit $ENV_FILE before going live."
