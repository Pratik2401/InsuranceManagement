#!/usr/bin/env bash

set -euo pipefail

APP_NAME="${APP_NAME:-snap2eat}"
DOMAIN_NAME="${DOMAIN_NAME:-snap2eat.in}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/snap2eat}"
DB_NAME="${DB_NAME:-insurance_management}"
DB_USER="${DB_USER:-insurance_app}"
DB_PASSWORD="${DB_PASSWORD:-}"
NODE_MAJOR="${NODE_MAJOR:-20}"
REPO_SCHEMA_FILE="${REPO_SCHEMA_FILE:-$DEPLOY_PATH/database/schema_and_seed.sql}"

escape_mysql_string() {
  printf '%s' "$1" | sed "s/'/''/g"
}

escape_mysql_identifier() {
  printf '%s' "$1" | sed 's/`/``/g'
}

if [[ -z "$DB_PASSWORD" ]]; then
  read -r -s -p "Enter MySQL password for $DB_USER: " DB_PASSWORD
  echo
fi

if [[ $EUID -ne 0 ]]; then
  exec sudo -E bash "$0" "$@"
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl gnupg ca-certificates lsb-release software-properties-common git nginx mysql-server rsync build-essential

install_node=false
if command -v node >/dev/null 2>&1; then
  current_node_major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
  if [[ "$current_node_major" -lt "$NODE_MAJOR" ]]; then
    install_node=true
  fi
else
  install_node=true
fi

if [[ "$install_node" == true ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

systemctl enable --now mysql
systemctl enable --now nginx

mkdir -p "$DEPLOY_PATH"
chown -R ubuntu:ubuntu "$DEPLOY_PATH"

escaped_db_name="$(escape_mysql_identifier "$DB_NAME")"
escaped_db_user="$(escape_mysql_string "$DB_USER")"
escaped_db_password="$(escape_mysql_string "$DB_PASSWORD")"

mysql -e "CREATE DATABASE IF NOT EXISTS \\`${escaped_db_name}\\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${escaped_db_user}'@'localhost' IDENTIFIED BY '${escaped_db_password}';"
mysql -e "ALTER USER '${escaped_db_user}'@'localhost' IDENTIFIED BY '${escaped_db_password}';"
mysql -e "GRANT ALL PRIVILEGES ON \\`${escaped_db_name}\\`.* TO '${escaped_db_user}'@'localhost'; FLUSH PRIVILEGES;"

if [[ -f "$REPO_SCHEMA_FILE" ]]; then
  mysql "$DB_NAME" < "$REPO_SCHEMA_FILE"
elif [[ -f "$DEPLOY_PATH/database/schema.sql" ]]; then
  mysql "$DB_NAME" < "$DEPLOY_PATH/database/schema.sql"
  if [[ -f "$DEPLOY_PATH/database/seed.sql" ]]; then
    mysql "$DB_NAME" < "$DEPLOY_PATH/database/seed.sql"
  fi
fi

cat <<EOF
Server bootstrap complete.

Next steps:
1. Copy deploy/nginx/snap2eat.in.conf to /etc/nginx/sites-available/${DOMAIN_NAME}
2. Enable the site and reload Nginx
3. Create ${DEPLOY_PATH}/backend/.env with DB_USER=${DB_USER}, DB_PASSWORD=***, and DB_NAME=${DB_NAME}
4. Add the GitHub Actions secrets described in DEPLOYMENT.md
EOF