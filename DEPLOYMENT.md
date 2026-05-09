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
2. Install backend dependencies on the server
3. Expect a prebuilt frontend to be uploaded (or provided as a tarball)
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

- `deploy/scripts/update-site.sh` — run this to pull the latest `main` branch, install backend dependencies, and restart the backend. The script expects a prebuilt frontend to be uploaded to the server (it will not run `npm run build` on the server by default). See the "Uploading a prebuilt frontend" section below for `rsync` and tarball examples.

Examples (run on the server):

```bash
# First time (provide REPO_URL or pre-clone the repo)
sudo REPO_URL='git@github.com:your/repo.git' bash /var/www/snap2eat/deploy/scripts/first-deploy.sh

# Subsequent updates
sudo bash /var/www/snap2eat/deploy/scripts/update-site.sh
```

Uploading a prebuilt frontend from your development machine

On your workstation, build the frontend normally. Recommended: enable Next's standalone output so the server does not need to run `npm ci`.

1) Standalone build (recommended when you cannot run `npm ci` on the server)

- In `frontend/next.config.ts` set:

```ts
export default {
	output: 'standalone',
	// other config...
}
```

- Build locally and upload the standalone bundle plus static/public directories:

```bash
cd frontend
npm ci
npm run build

# From your local repo root, sync standalone and static files
rsync -avz --delete frontend/.next/standalone/ ubuntu@13.233.204.92:/var/www/snap2eat/frontend/.next/standalone/
rsync -avz --delete frontend/.next/static/ ubuntu@13.233.204.92:/var/www/snap2eat/frontend/.next/static/
rsync -avz --delete frontend/public/ ubuntu@13.233.204.92:/var/www/snap2eat/frontend/public/
```

On the server `update-site.sh` will detect `.next/standalone` and start the frontend using the bundled server (`node .next/standalone/server.js`) so no `npm ci` is required.

2) Regular prebuilt (if you prefer `next start` on the server)

If you cannot use standalone, upload the `.next` and `public` dirs and then install production deps on the server before starting:

```bash
cd frontend
npm ci
npm run build

# From your local repo root
rsync -avz --delete frontend/.next/ ubuntu@13.233.204.92:/var/www/snap2eat/frontend/.next/
rsync -avz --delete frontend/public/ ubuntu@13.233.204.92:/var/www/snap2eat/frontend/public/
rsync -avz frontend/package.json ubuntu@13.233.204.92:/var/www/snap2eat/frontend/package.json

# then on server (if you can run npm ci)
sudo -u ubuntu npm ci --prefix /var/www/snap2eat/frontend --omit=dev
```

After uploading, on the server run:

```bash
sudo bash /var/www/snap2eat/deploy/scripts/update-site.sh
```