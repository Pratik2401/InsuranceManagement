# Lightsail Deployment

This repo is ready for a simple GitHub Actions deploy to an Ubuntu 22 Lightsail instance.

## Production Shape

- Next.js frontend runs on `127.0.0.1:3000`
- Express backend runs on `127.0.0.1:5000`
- Nginx serves `snap2eat.in` and proxies everything to Next.js
- Next.js rewrites `/api/*` to the backend and `/uploads/*` to the backend static file server

## One-Time Server Setup

1. Point the domain `snap2eat.in` to the Lightsail public IPv4 address `13.233.204.92`.
2. SSH into the server as `ubuntu`.
3. Clone the repository onto the server and run the bootstrap script once to install Node.js, Nginx, MySQL, and PM2:

```bash
sudo mkdir -p /var/www
sudo chown ubuntu:ubuntu /var/www
git clone <your-repo-url> /var/www/snap2eat
cd /var/www/snap2eat
sudo bash deploy/scripts/setup-server.sh
```

If you want to run it directly with `./setup-server.sh`, make it executable first:

```bash
chmod +x deploy/scripts/setup-server.sh
```

4. Create `backend/.env` on the server with your production values.
5. Copy the Nginx config from `deploy/nginx/snap2eat.in.conf` into `/etc/nginx/sites-available/snap2eat.in` and enable it.
6. Install PM2 once for the `ubuntu` user:

```bash
npx --yes pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Run the command that PM2 prints after that step, then save the process list after the first deploy with `npx --yes pm2 save`.

## GitHub Secrets

Add these secrets in the repository settings:

- `SSH_HOST` = `13.233.204.92`
- `SSH_USER` = `ubuntu`
- `SSH_PRIVATE_KEY` = private key for the `ubuntu` account

## Deployment Flow

Every push to `main` will:

1. Sync the repository to `/var/www/snap2eat`
2. Install backend and frontend dependencies
3. Build the Next.js app
4. Restart the backend and frontend processes with PM2

## Notes

- Keep `backend/.env` on the server, not in GitHub.
- The bootstrap script installs MySQL Server and creates the `insurance_management` database plus a dedicated app user by default.
- If you want to keep the default backend config, you can leave `DB_USER=root`, but a dedicated MySQL user is safer for production.
- Uploaded policy PDFs are stored under `backend/uploads/` and are excluded from deploy syncs so they are not overwritten.
- If you want HTTPS, add a Let’s Encrypt certificate after the Nginx site is working on port 80.

Local helper scripts (on the server)

Two convenience scripts are included at `deploy/scripts/` to make first-time and subsequent deploys easier. Copy them to the server (they're included in the repo) and make them executable:

```bash
sudo chmod +x /var/www/snap2eat/deploy/scripts/*.sh
```

- `deploy/scripts/first-deploy.sh` — run this on a fresh server to clone the repo (if needed), run the system bootstrap (`setup-server.sh`), install the Nginx site, create a sample `backend/.env` (doesn't overwrite existing), configure PM2 startup, and perform an initial update.

- `deploy/scripts/update-site.sh` — run this to pull the latest `main` branch, install deps, build the frontend, and restart the backend/frontend processes under PM2.

Examples (run on the server):

```bash
# First time (provide REPO_URL or pre-clone the repo)
sudo REPO_URL='git@github.com:your/repo.git' bash /var/www/snap2eat/deploy/scripts/first-deploy.sh

# Subsequent updates
sudo bash /var/www/snap2eat/deploy/scripts/update-site.sh
```