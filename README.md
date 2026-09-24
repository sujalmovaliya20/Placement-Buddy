# Placement Buddy

A production-grade, highly optimized College Placement Management System. This project is built as a robust, centralized web application designed to bridge the gap between students, placement officers, and recruiting companies by automating drive tracking, real-time alerts, and placement lifecycle analytics.

---

## 🏗 System Architecture

The platform follows a strict 3-tier architecture, implemented as a Node.js/TypeScript Monorepo using `npm workspaces`:

```text
placement-buddy/
├── frontend/          # Client Tier (Next.js 14)
├── backend/           # Server Tier (Express + TypeScript)
├── shared/            # Common interfaces & Data contracts
├── package.json       # Monorepo root
└── tsconfig.base.json # Shared strict TS configuration
```

### Backend Architecture (Layered Pattern)

The backend strictly adheres to a layered architectural pattern to separate concerns and maintain clean business logic:

```text
Routes → Controllers → Services → Models (MongoDB)
  ↓          ↓            ↓
  HTTP    Orchestration  Business Logic + Aggregations
```

- **Routes:** Defines RESTful endpoints and attaches middleware (rate-limiting, compression, validation, auth).
- **Controllers:** Parses incoming requests, triggers appropriate services, and formats HTTP JSON responses. Never interfaces with the database directly.
- **Services:** Encapsulates the core business logic (e.g., WhatsApp integration, Analytics processing).
- **Models:** Defines MongoDB Mongoose schemas, types, and optimized database indexes.

---

## 🚀 Key Technical Features

1. **High-Performance Analytics Engine:**
   - Global analytics and placement statistics are computed at the database level using highly optimized **MongoDB Aggregation Pipelines** (`$group`, `$lookup`, `$bucket`).
   - Compound indexes (e.g., `{ drive_id: 1, status: 1 }`) are applied to critical data schemas to ensure scaling without API latency.

2. **Automated WhatsApp Gateway Integration:**
   - Real-time broadcast alerts (new placement drives, deadline warnings) are pushed to student groups via a RESTful integration with the self-hosted **OpenWA API Gateway**.

3. **Secure Monorepo Design:**
   - The `shared/` package acts as the single source of truth for TypeScript interfaces across the stack, guaranteeing 100% type safety between frontend API calls and backend data models.

4. **Network & Security Standards:**
   - API payloads are automatically optimized using `gzip` compression middleware.
   - Robust security headers and CORS policies are enforced via `helmet`.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Client** | Next.js 14 (App Router), React 18, TypeScript |
| **Server** | Node.js (≥ 18.17.0), Express.js, TypeScript |
| **Database** | MongoDB (Mongoose ODM) |
| **Messaging API** | OpenWA API Gateway |
| **Infrastructure** | Docker, npm workspaces |

---

## ⚙️ Getting Started

### 1. Prerequisites

- **Node.js** ≥ 18.17.0
- **npm** ≥ 9.0.0
- **MongoDB** Instance (Local or Atlas)

### 2. Installation

Install all workspace dependencies from the root:
```bash
npm install
```

### 3. Environment Configuration

Duplicate the environment templates for both backend and frontend:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Ensure you provide your MongoDB connection string in the backend `.env`.

### 4. Running the Platform

Start both development servers concurrently:
```bash
npm run dev
```
*(The frontend runs on `http://localhost:3000` and the backend runs on `http://localhost:5000`)*

### 5. Production Build

To compile TypeScript and build the Next.js assets:
```bash
npm run build
```

---

## 📱 WhatsApp Integration Setup

The backend communicates with a self-hosted **[rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA)** API gateway.

1. **Deploy OpenWA:**
   ```bash
   git clone https://github.com/rmyndharis/OpenWA.git
   cd OpenWA
   docker compose -f docker-compose.dev.yml up -d
   ```
2. **Link Device:** Access the Dashboard at `http://localhost:2785` to scan the QR code.
3. **Configure ENV Variables:** Add `OPENWA_API_URL`, `OPENWA_API_KEY`, and `OPENWA_SESSION_ID` to your backend `.env` file.
4. **Fetch Target Group ID:** Run the utility script to extract the WhatsApp group ID you want to broadcast to:
   ```bash
   npx tsx backend/scripts/get-whatsapp-groups.ts
   ```
   Set this ID as `WHATSAPP_GROUP_ID` in your backend `.env`.

---

## 📜 License

Private — All rights reserved.
