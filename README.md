# Insurance Management System

A full-stack Insurance Management web application built with **Next.js 14**, **Node.js/Express**, and **MySQL**.

---

## 📁 Project Structure

```
InsuranceManagement/
├── frontend/        # Next.js 14 (App Router, TypeScript, Tailwind CSS)
├── backend/         # Node.js + Express REST API
├── database/        # MySQL schema & seed files
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- MySQL 8.0+

---

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE insurance_management;

# Run schema
mysql -u root -p insurance_management < database/schema.sql

# (Optional) Seed sample data
mysql -u root -p insurance_management < database/seed.sql
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # Fill in your DB credentials and JWT secret
npm install
npm run dev            # Starts on http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev            # Starts on http://localhost:3000
```

---

## 🔑 Environment Variables (Backend)

| Variable         | Description                     |
|------------------|---------------------------------|
| `DB_HOST`        | MySQL host (default: localhost) |
| `DB_PORT`        | MySQL port (default: 3306)      |
| `DB_USER`        | MySQL username                  |
| `DB_PASSWORD`    | MySQL password                  |
| `DB_NAME`        | Database name                   |
| `JWT_SECRET`     | Secret key for JWT signing      |
| `JWT_EXPIRES_IN` | JWT expiry (e.g., `7d`)         |
| `PORT`           | Server port (default: 5000)     |

---

## 🛠 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS    |
| Backend   | Node.js, Express.js                     |
| Database  | MySQL 8.0                               |
| Auth      | JWT (HTTP-only cookies)                 |
| ORM/Query | mysql2 (raw SQL with Promise support)   |
