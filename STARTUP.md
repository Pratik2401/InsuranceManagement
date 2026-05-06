# Insurance Management System - Quick Start Guide

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **MySQL Server** (v5.7 or higher) - Running and accessible
3. **Internet Connection** (for Cloudflare tunnel setup)

## Database Setup

Before running the application for the first time, initialize the database:

```bash
# Navigate to database directory
cd database

# Load schema and seed data (use whichever is available)
# Option 1: Combined file (recommended)
mysql -u root -p insurance_management < schema_and_seed.sql

# Option 2: Separate files
mysql -u root -p insurance_management < schema.sql
mysql -u root -p insurance_management < seed.sql
```

Replace:
- `root` with your MySQL username
- When prompted, enter your MySQL password
- `insurance_management` with your database name

## Running the Application

### Option 1: Full Startup (Recommended)
Starts backend, frontend, and Cloudflare tunnel automatically:

```bash
run-all.bat
```

This will:
1. Download cloudflared (if not already present)
2. Install dependencies (if missing)
3. Start MySQL backend on port 5000
4. Start Next.js frontend on port 3000
5. Start Cloudflare tunnel

### Option 2: Backend + Tunnel Only
Starts only backend and Cloudflare tunnel (frontend started manually):

```bash
run.bat
```

Then in a separate terminal, start the frontend:
```bash
cd frontend
npm run dev
```

### Option 3: Manual Startup

Start each service individually:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Cloudflare Tunnel
cd cloudflared
cloudflared.exe tunnel --url http://localhost:3000
```

## Default Credentials

### Admin Login
- **Email:** admin@example.com
- **Password:** admin@123
- **Role:** Administrator (full access to all features including audit logs)

### Agent Login
- **Email:** agent@example.com
- **Password:** (check database seed for current hash)
- **Role:** Agent (access to leads, policies, products, customers, claims, payments)

## Service URLs

- **Frontend (Local):** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health
- **Cloudflare Tunnel:** (URL displayed in tunnel window)

## What Each Batch File Does

### `run.bat`
- Checks for cloudflared installation
- Downloads cloudflared if needed
- Starts backend on port 5000
- Starts Cloudflare tunnel
- Frontend must be started separately

### `run-all.bat`
- Same as `run.bat` PLUS
- Checks for Node.js dependencies
- Installs npm packages (if missing)
- Starts frontend on port 3000
- Starts all three services in separate windows

## Troubleshooting

### Cloudflared Download Fails
- Ensure internet connection is active
- Manually download from: https://github.com/cloudflare/cloudflared/releases
- Extract `cloudflared-windows-amd64.exe` to `.\cloudflared\` folder
- Rename to `cloudflared.exe`

### Port Already in Use
```bash
# Kill process on port (example for 5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Connection Error
- Verify MySQL is running
- Check `backend/.env` for correct DB credentials
- Verify database name matches your setup

### Dependencies Not Installing
```bash
# Clear node_modules and reinstall
cd backend
rm -r node_modules
npm cache clean --force
npm install

cd ../frontend
rm -r node_modules
npm cache clean --force
npm install
```

## Environment Variables

### Backend (`backend/.env`)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=insurance_management
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### Frontend (Next.js - uses `.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## API Endpoints (Sample)

All endpoints require JWT authentication (Bearer token in Authorization header)

### Auth
- `POST /api/auth/register` - Register new agent
- `POST /api/auth/login` - Login (admin or agent)

### Leads (Agent Only)
- `GET /api/leads` - List all leads
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Policies (Agent Only)
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

### Admin Only
- `GET /api/admin/summary` - Dashboard summary
- `GET /api/admin/users` - List all users
- `GET /api/admin/settings` - App settings
- `GET /api/admin/audit-logs` - Audit logs

## Stopping Services

- **Close the command window** or press `Ctrl+C` in each terminal
- This stops the respective service (backend, frontend, tunnel)

## Support

For issues:
1. Check logs in each service window
2. Verify all prerequisites are installed
3. Ensure database is properly seeded
4. Check port availability (3000, 5000, 3306)

## Next Steps

1. Run database setup (see Database Setup section)
2. Execute `run-all.bat` to start everything
3. Open http://localhost:3000 in your browser
4. Login with admin credentials
5. Start managing insurance policies!
