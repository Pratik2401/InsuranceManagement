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
3. Install Node.js 18+ and Nginx.
4. Create the deploy directory:

```bash
sudo mkdir -p /var/www/snap2eat
sudo chown -R ubuntu:ubuntu /var/www/snap2eat
```

5. Clone this repository into `/var/www/snap2eat` once, or let the first GitHub Actions deploy populate it.
6. Create `backend/.env` on the server with your production values.
7. Copy the Nginx config from `deploy/nginx/snap2eat.in.conf` into `/etc/nginx/sites-available/snap2eat.in` and enable it.
8. Install PM2 once for the `ubuntu` user:

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
- Uploaded policy PDFs are stored under `backend/uploads/` and are excluded from deploy syncs so they are not overwritten.
- If you want HTTPS, add a Let’s Encrypt certificate after the Nginx site is working on port 80.