# InsureFlow — Insurance Management System

> A full-stack, dark-themed insurance agency management platform built for tracking policies, leads, renewals, and business analytics in real time.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Backend API](#5-backend-api)
6. [Authentication System](#6-authentication-system)
7. [Pages & Features](#7-pages--features)
   - [Login Page](#71-login-page)
   - [Register Page](#72-register-page)
   - [Forgot Password Page](#73-forgot-password-page)
   - [Dashboard Overview](#74-dashboard-overview)
   - [New Business](#75-new-business)
   - [Policy Renewals](#76-policy-renewals)
   - [Upcoming Renewals](#77-upcoming-renewals)
   - [Leads Tracking](#78-leads-tracking)
   - [Business Analytics](#79-business-analytics)
   - [Product Master](#710-product-master)
8. [Shared UI Components & Utilities](#8-shared-ui-components--utilities)
9. [Running the Project Locally](#9-running-the-project-locally)

---

## 1. Project Overview

**InsureFlow** is a full-stack web application designed for insurance agents and administrators to manage their entire book of business from a single, unified interface. The system covers the complete insurance lifecycle:

- **New Policy Acquisition** — recording and managing newly issued policies (GWP, insurer, holder, product type)
- **Lead Management** — tracking prospects from first contact through to conversion or loss
- **Renewal Management** — monitoring policies due for renewal, including overdue and upcoming timelines
- **Business Analytics** — executive-level reports on GWP trends, lead conversion rates, top insurers, and product mix
- **Product Master** — maintaining a central list of insurance product types used across the system

The UI is a premium dark-mode SPA (Single-Page Application) with responsive layouts, interactive charts (Recharts), sortable/paginated tables, inline CRUD modals, and Excel import/export capabilities. Authentication is handled via JWT tokens stored in `localStorage`, with role-based access (`admin` / `agent`).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Bootstrap 5, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (via `mysql2` connection pool) |
| **Authentication** | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| **Email** | Brevo (Sendinblue) Transactional Email API — OTP delivery |
| **Form Validation** | `react-hook-form` + `zod` |
| **Notifications** | `react-hot-toast` |
| **Data Export** | `xlsx` (SheetJS) — Excel & CSV |
| **Icons** | `lucide-react` |
| **HTTP Client** | `axios` (preconfigured base URL + auth header injection) |
| **Fonts** | Manrope (headings), Inter (body) — Google Fonts |

---

## 3. Project Structure

```
InsuranceManagement/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MySQL2 connection pool
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verifyToken middleware
│   │   ├── routes/
│   │   │   ├── index.js           # Route aggregator (/api/...)
│   │   │   ├── auth.js            # Register, Login, Forgot/Reset Password
│   │   │   ├── policies.js        # CRUD + Bulk import for policies
│   │   │   ├── leads.js           # CRUD + Bulk import for leads
│   │   │   └── products.js        # CRUD for product master
│   │   └── server.js              # Express entry point
│   ├── .env                       # DB credentials, JWT secret, Brevo keys
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx         # Auth layout (no sidebar)
│   │   │   ├── login/             # Login page
│   │   │   ├── register/          # Registration page
│   │   │   └── forgot-password/   # OTP-based password reset flow
│   │   ├── dashboard/
│   │   │   ├── layout.tsx         # Sidebar + Topbar shell (auth guard)
│   │   │   ├── page.tsx           # Dashboard Overview
│   │   │   ├── new-business/      # New Business (Policy Records)
│   │   │   ├── renewal/           # Policy Renewals
│   │   │   ├── upcoming-renewals/ # Upcoming & Overdue Renewals
│   │   │   ├── leads/             # Leads & CRM Pipeline
│   │   │   ├── business/          # Business Analytics
│   │   │   └── products/          # Product Master
│   │   ├── globals.css            # Design system tokens, dark theme
│   │   └── layout.tsx             # Root layout (fonts, toast provider)
│   ├── components/
│   │   ├── DataMobility.tsx       # ExportDropdown & ImportExcelButton
│   │   └── ToastProvider.tsx      # react-hot-toast wrapper
│   ├── context/
│   │   └── AuthContext.tsx        # Global auth state (JWT + user)
│   └── lib/
│       └── axios.ts               # Preconfigured Axios instance
│
└── database/
    ├── schema.sql                 # Full MySQL table definitions
    └── seed.sql                   # Sample seed data
```

---

## 4. Database Schema

The MySQL database contains six core tables:

| Table | Purpose |
|---|---|
| `users` | Stores agent/admin accounts with hashed passwords and roles |
| `password_reset_tokens` | OTP tokens (6-digit, 10-min TTL) for password recovery |
| `leads` | Prospect records with status tracking (Active / Converted / Lost) |
| `customers` | Policy holder personal details |
| `policies` | Insurance policies: number, holder, type, insurer, premium, dates |
| `claims` | Claims linked to policies and customers |
| `payments` | Premium payment records with method and status |

> **Note:** The frontend primarily interacts with `leads`, `policies`, and a separate `products` table (managed via the backend route). The `customers`, `claims`, and `payments` tables are defined for future module expansion.

---

## 5. Backend API

The Express server runs on **port 5000** and exposes all routes under the `/api` prefix.

### Auth Routes (`/api/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create a new user account (returns JWT) |
| `POST` | `/login` | Authenticate and return JWT + user object |
| `POST` | `/forgot-password` | Generate & email a 6-digit OTP via Brevo |
| `POST` | `/verify-otp` | Validate an OTP before allowing password reset |
| `POST` | `/reset-password` | Hash and update the new password |
| `GET` | `/me` | Return the authenticated user's profile (protected) |

### Policy Routes (`/api/policies`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Fetch all policies |
| `POST` | `/` | Create a single policy |
| `PUT` | `/:id` | Update an existing policy |
| `DELETE` | `/:id` | Delete a policy |
| `POST` | `/bulk` | Bulk import policies from an Excel template |

### Lead Routes (`/api/leads`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Fetch all leads |
| `POST` | `/` | Create a single lead |
| `PUT` | `/:id` | Update an existing lead |
| `DELETE` | `/:id` | Delete a lead |
| `POST` | `/bulk` | Bulk import leads from an Excel template |

### Product Routes (`/api/products`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Fetch all products |
| `POST` | `/` | Create a new product (unique name enforced) |
| `PUT` | `/:id` | Update a product |
| `DELETE` | `/:id` | Delete a product |

---

## 6. Authentication System

InsureFlow uses **JWT-based stateless authentication**.

### Flow

1. **Login / Register** → Backend validates credentials, signs a JWT (7-day expiry by default), and returns `{ token, user }`.
2. **Frontend `AuthContext`** → Stores the token in `localStorage` under the key `insureflow_token` and the user object under `insureflow_user`. Exposes `login()`, `logout()`, and the reactive `user` / `isLoading` states to all components via React Context.
3. **Axios Interceptor** (`lib/axios.ts`) → Automatically attaches `Authorization: Bearer <token>` to every outgoing API request.
4. **Dashboard Auth Guard** (`dashboard/layout.tsx`) → On mount, checks `isLoading` + `user`. If no token is found in `localStorage`, redirects to `/login`.
5. **Backend Middleware** (`middleware/auth.js`) → `verifyToken` decodes the JWT and attaches `req.user` for protected routes.

### Password Reset (OTP Flow)

1. User submits email on the **Forgot Password** page.
2. Backend generates a 6-digit OTP, stores it with a 10-minute expiry, and sends it via the **Brevo** email API.
3. User enters the OTP on the verification step.
4. Upon successful OTP verification, user sets a new password which is bcrypt-hashed before storage.
5. The used OTP is invalidated to prevent reuse.

> In development (no Brevo keys set), the OTP is printed to the backend console log.

---

## 7. Pages & Features

### 7.1 Login Page

**Route:** `/login`

**Purpose:** Entry point for all users. Authenticates existing agents and administrators.

**Operation:**
- Renders a centered dark-mode auth card with ambient glow blobs in the background.
- Form fields: **Email** and **Password** (with toggle show/hide).
- Validation is performed client-side using `react-hook-form` + `zod` (email format check, password required).
- On submission, calls `POST /api/auth/login`. On success, the JWT and user object are stored in `localStorage` via `AuthContext.login()` and the user is redirected to `/dashboard`.
- On failure, a server error message is displayed inline (e.g., "Invalid email or password.").
- Includes a link to `/forgot-password` and `/register`.

---

### 7.2 Register Page

**Route:** `/register`

**Purpose:** Allows new users to create an InsureFlow account as either an **Agent** or **Admin**.

**Operation:**
- Form fields: **Full Name**, **Email**, **Role** (radio: Agent / Admin), **Password**, **Confirm Password**.
- Includes a live **password strength meter** (5-bar visual indicator: Weak → Very Strong), scored by uppercase, lowercase, digit, special character, and minimum length checks.
- Validates that both password fields match using a Zod `refine()` rule.
- On success, calls `POST /api/auth/register`, auto-logs in the new user, and redirects to `/dashboard`.
- Duplicate email addresses return a `409 Conflict` error displayed inline.

---

### 7.3 Forgot Password Page

**Route:** `/forgot-password`

**Purpose:** Enables account recovery without admin intervention using a secure OTP flow.

**Operation:**
- **Step 1 — Email Entry:** User enters their registered email. A 6-digit OTP is sent to that address via Brevo.
- **Step 2 — OTP Verification:** User enters the OTP received. The backend validates it against the stored token (checking expiry and `used` flag).
- **Step 3 — New Password:** User sets and confirms a new password (minimum 8 characters). On success, the backend bcrypt-hashes the new password and invalidates the OTP token.
- The user is then redirected to `/login`.

---

### 7.4 Dashboard Overview

**Route:** `/dashboard`

**Purpose:** The main landing page after login. Provides a high-level snapshot of the entire insurance portfolio at a glance.

**Operation:**
- On mount, fetches all policies from `GET /api/policies` and computes all metrics client-side.
- **KPI Cards (4):**
  - **New Business (This Month):** Sum of GWP for policies issued in the current calendar month.
  - **Total Business Till Date:** Cumulative GWP across all policies.
  - **Policies Issued:** Total count of all policies in the system.
  - **Total GWP:** Mirrors total business as a financial metric.
- **GWP Trend Chart (Area Chart):** Monthly Gross Written Premium trajectory, aggregated from policy issue dates. Uses a purple-gradient area fill with Recharts `AreaChart`.
- **Product Mix Chart (Donut/Pie Chart):** Percentage breakdown of the portfolio by product type (Motor, Health, Life, General) with a color-coded legend.
- **Recent Policies Table:** The 4 most recently added policies showing Policy No., Holder, Product Type, GWP, and Status.
- All data refreshes on each page load from the live database.
- Supports **Excel/CSV export** of the recent policies table via the `ExportDropdown` component.

---

### 7.5 New Business

**Route:** `/dashboard/new-business`

**Purpose:** The master ledger for all insurance policies written. Allows agents to record, view, edit, and delete policy records.

**Operation:**
- Fetches policies from `GET /api/policies` and products from `GET /api/products` on mount.
- **Summary Cards (2):**
  - **Total Policies:** Count of all policy records in the system.
  - **Premium Aggregate:** Sum total of all GWP values across all policies.
- **Master Policy Records Table:** Columns — Date, Policy No., Holder, Product (badge), Insurer, Policy Type, GWP, Actions.
  - **Sortable columns:** Date, Policy No., Holder, Insurer, GWP — clicking a column header toggles ascending/descending sort.
  - **Search:** Filters by holder name, policy number, or insurer name in real time.
  - **Type Filter:** Dropdown to filter records by product type (Motor, Health, Life, General, or All).
  - **Pagination:** Configurable page size (5 / 10 / 20 rows); shows current range and total count.
- **New Policy Button:** Opens a modal form with fields for Policy No., Holder Name, Insurer, GWP, Product type (dropdown from Product Master), and Policy Type (e.g., Comprehensive, Term Plan). Calls `POST /api/policies`.
- **Edit (✏️) / Delete (🗑️) Actions:** Inline per-row buttons. Edit opens the same modal pre-populated; Delete calls `DELETE /api/policies/:id` after a confirmation prompt.
- **Excel Import:** `ImportExcelButton` accepts an `.xlsx` file matching the template columns (Date, Policy No, Holder, Company, Type, Policy Type, GWP) and calls `POST /api/policies/bulk` to insert all rows at once.
- **Excel/CSV Export:** `ExportDropdown` exports the currently filtered and sorted data set.

---

### 7.6 Policy Renewals

**Route:** `/dashboard/renewal`

**Purpose:** Tracks the renewal history and retention metrics for the agency's book of business.

**Operation:**
- Fetches all policies from `GET /api/policies` and uses their issue dates to calculate renewal KPIs.
- **KPI Cards (4):**
  - **Renewals This Month:** Count of policies with an issue date in the current month.
  - **Retained GWP:** Sum of GWP for policies issued this month.
  - **Total Renewed (YTD):** Count of all policies across the entire database.
  - **Cumulative Premium:** Total GWP in lakhs (₹L format).
- **Monthly Renewal Volume (Bar Chart):** Amber-gradient bar chart showing the count of policies renewed each month, derived from issue date grouping.
- **Recent Renewals Table:** Columns — Insurer, Policy Holder, Policy No., Renewal Date, Premium (GWP).
  - **Sortable columns:** All columns support ascending/descending sort.
  - **Search:** Real-time filter by holder, policy number, or insurer.
  - **Pagination:** 5 or 10 rows per page with previous/next navigation.
- **Excel/CSV Export:** Exports the filtered dataset using `ExportDropdown`.

---

### 7.7 Upcoming Renewals

**Route:** `/dashboard/upcoming-renewals`

**Purpose:** A proactive tool for agents to identify and action policies that are approaching their renewal due date, are due this week, or are already overdue.

**Operation:**
- Fetches policies from `GET /api/policies`, mapping each record's `endDate` field as the renewal due date.
- Computes `daysUntil(dueDate)` relative to a reference date for urgency classification:
  - **Overdue (< 0 days):** Red badge, row highlighted with a subtle red background.
  - **Due This Week (0–7 days):** Amber badge with a clock icon.
  - **Upcoming (> 7 days):** Green badge with a checkmark icon.
- **Status Summary Cards (3):** Overdue count (red), Due This Week count (amber), Upcoming count (green) — all computed live from the data.
- **Filter Buttons:** Quick-filter the table to `All`, `Overdue`, `Due This Week`, or `Future` records.
- **Table Columns:** Policy Name (type/policyType), Holder, Insurer, Policy No., Due Date, Premium, Status Badge.
  - **Sortable columns:** All columns support sort.
  - **Search:** Filter by holder, policy number, or insurer.
  - **Pagination:** 5 or 10 rows per page.
- **Excel/CSV Export:** Exports the active filtered view.

---

### 7.8 Leads Tracking

**Route:** `/dashboard/leads`

**Purpose:** A CRM-style pipeline manager for tracking prospective clients (leads) from initial contact through to policy conversion or loss.

**Operation:**
- Fetches leads from `GET /api/leads` and products from `GET /api/products` on mount.
- **KPI Cards (4)** — derived from the most recent month in the data:
  - **Leads Given (This Month):** Total leads generated.
  - **Active Prospects:** Leads that are neither Converted nor Lost.
  - **Won (This Month):** Count of Converted leads.
  - **Lost (This Month):** Count of Lost leads.
- **Lead Conversion Velocity (Grouped Bar Chart):** Monthly breakdown of `Generated`, `Converted`, and `Lost` lead counts side by side using Recharts `BarChart`. Allows agents to visually assess conversion trends over time.
- **Pipeline Roster Table:** Columns — Prospect, Contact (phone), Product Interest, Added On, Status, Actions.
  - **Status badges:** Active (indigo), Converted (green), Lost (red).
  - **Sortable columns:** Prospect, Contact, Product Interest, Added On, Status.
  - **Search:** Filter by prospect name, phone, or product interest.
  - **Status Filter Dropdown:** Filter by All / Active / Converted / Lost.
  - **Pagination:** 5 or 10 rows per page.
- **New Lead Button:** Opens a modal with fields for Prospect Name, Contact Info, Product Interest (dropdown from Product Master), and Status. Calls `POST /api/leads`.
- **Edit / Delete:** Inline actions. Edit opens a pre-populated modal; Delete calls `DELETE /api/leads/:id`.
- **Excel Import:** Bulk import leads via `.xlsx` using the template columns (Prospect, Contact, Product Interest, Added On, Status). Calls `POST /api/leads/bulk`.
- **Excel/CSV Export:** Exports the current filtered and sorted lead list.

---

### 7.9 Business Analytics

**Route:** `/dashboard/business`

**Purpose:** An executive-level analytics dashboard providing macro-level insights across the full portfolio — combining policy and lead data into unified business intelligence.

**Operation:**
- Fetches both policies (`GET /api/policies`) and leads (`GET /api/leads`) in parallel on mount. All metrics are computed algorithmically client-side.
- **GWP vs Policy Volume (Composed Chart):** A dual-axis Recharts `ComposedChart` overlaying:
  - **Area line** (left Y-axis): Monthly Total GWP trajectory.
  - **Green bars** (right Y-axis): Monthly count of policies written.
  - Provides a cross-reference view for understanding the relationship between volume and value.
- **Quarterly Aggregation Table:** Month-by-month breakdown of Policies written, Converted Leads, and Gross Written Premium, exportable as Excel/CSV.
- **Key Insights Panel (5 metrics):**
  - **Lead Conversion Rate:** `(Converted Leads / Total Leads) × 100%`
  - **Top Revenue Insurer:** The insurer with the highest cumulative GWP.
  - **Top Product:** The product type with the most policies issued.
  - **Pending Renewals:** Count of policies with a due date within the next 60 days.
  - **Attrition (YTD):** Count of Lost leads in the current calendar year.
- **Dynamic System Alert:** Compares the lead conversion rate of the two most recent months (Month-over-Month). Displays as:
  - 🟢 **Positive Signal** (green): If conversion rate improved — encourages continued nurturing of the top product.
  - 🔴 **System Alert** (red): If conversion rate declined — recommends initiating follow-up for pending renewals in the top product category.
  - The alert pulses with a live dot indicator and updates in real time based on actual data.

---

### 7.10 Product Master

**Route:** `/dashboard/products`

**Purpose:** A central registry for all insurance product types used throughout the system (e.g., Motor, Health, Life, General). All policy and lead forms reference this list dynamically.

**Operation:**
- Fetches all products from `GET /api/products` on mount.
- **Summary Card:** Displays the total count of master products registered in the system.
- **Product List Table:** Columns — Product Name, Description, Created On, Actions.
  - **Sortable columns:** Product Name, Description, Created On.
  - **Search:** Real-time filter by product name or description.
  - **Pagination:** 5 / 10 / 20 rows per page.
- **New Product Button:** Opens a modal with fields for Product Name (required, unique) and Description (optional textarea). Calls `POST /api/products`.
  - Duplicate product names return a `409 Conflict` error, displayed as a toast notification.
- **Edit / Delete:** Inline actions. Edit opens pre-populated modal (`PUT /api/products/:id`); Delete confirms before calling `DELETE /api/products/:id`.
- **Excel/CSV Export:** Exports the product list.

> **Important:** Deleting a product from the master list does not cascade-delete existing policies or leads that reference it, but it will remove it from the dropdown options in all creation/edit forms going forward.

---

## 8. Shared UI Components & Utilities

### `DataMobility.tsx` — Export & Import

Two reusable components powering data portability across all pages:

#### `ExportDropdown`
- Renders a button with a dropdown menu offering **Export as Excel (.xlsx)** and **Export as CSV** options.
- Accepts `data` (array of objects), `filename` (string), and `columns` (array of `{ header, key }` mappings).
- Uses the `xlsx` (SheetJS) library to generate and trigger a browser download.

#### `ImportExcelButton`
- Renders an **Import Excel** button that opens a hidden `<input type="file">` accepting `.xlsx` files.
- Parses the uploaded workbook using `xlsx`, maps column headers to API field names via a `columnMap` prop.
- Calls the `onImport(rows)` callback with the cleaned array of row objects.
- Includes a **Download Template** option that generates a sample `.xlsx` file pre-filled with `dummyRows` to guide users on the correct format.

### `AuthContext.tsx` — Global Auth State

- Wraps the entire app in a React Context providing: `user`, `isLoading`, `login(token, user)`, `logout()`.
- On mount, reads `insureflow_token` and `insureflow_user` from `localStorage` to rehydrate auth state across page refreshes.
- `logout()` clears both `localStorage` keys and resets the user state to `null`.

### `lib/axios.ts` — Preconfigured HTTP Client

- Creates an Axios instance with `baseURL` set to `http://localhost:5000/api`.
- A **request interceptor** automatically reads `insureflow_token` from `localStorage` and attaches it as the `Authorization: Bearer` header on every request — no manual header management needed anywhere in the app.

### `globals.css` — Design System

The central stylesheet defines all design tokens and reusable utility classes:

| Token / Class | Purpose |
|---|---|
| `--bg-base`, `--bg-card` | Dark background layers (`#111319`, `#1e1f26`) |
| `--color-brand` | Primary indigo accent (`#4F46E5`) |
| `.dash-card` | Standard dark card with subtle border and backdrop blur |
| `.sidebar`, `.topbar` | Fixed navigation shell styles |
| `.table-custom` | Dark-themed table with hover rows |
| `.search-box` | Unified search input with icon slot |
| `.stat-badge` | Pill-shaped status indicator |
| `.pagination-container` | Pagination controls styling |
| `.btn-page` | Individual page number button |

---

## 9. Running the Project Locally

### Prerequisites

- Node.js ≥ 18
- MySQL ≥ 8.0
- A Brevo account (optional, for OTP emails in production)

### 1. Database Setup

```sql
-- Run in MySQL Workbench or CLI:
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials, JWT_SECRET, and (optionally) Brevo keys
npm install
npm run dev
# Server starts on http://localhost:5000
```

### Backend `.env` Variables

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=insurance_db
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# Optional — for OTP email delivery
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:3000
```

### 4. Access the App

Open `http://localhost:3000` in your browser. You will be redirected to `/login`. Register a new account or use a seeded user from `database/seed.sql`.

---

*InsureFlow v1.0 — © 2025. Built with Next.js, Express, and MySQL.*
