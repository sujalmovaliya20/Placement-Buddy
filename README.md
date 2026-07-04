# Placement Platform

Production-grade college placement management system built as a TypeScript monorepo.

## Architecture

```
placement-platform/
├── frontend/          # Next.js 14 (App Router) + Tailwind + shadcn/ui
├── backend/           # Express + TypeScript (layered architecture)
├── shared/            # TypeScript interfaces — single source of truth
├── package.json       # npm workspaces root
└── tsconfig.base.json # shared strict TypeScript config
```

### Backend Architecture (Layered)

```
Routes → Controllers → Services → Models
  ↓          ↓            ↓
  HTTP    Orchestration  Business Logic + DB
```

- **Routes** define endpoints and attach middleware (validation, auth)
- **Controllers** parse requests, call services, format responses
- **Services** contain business logic and database interactions
- **Models** define database-layer types and schemas

Controllers never touch the database directly. Services never send HTTP responses.

## Prerequisites

- **Node.js** ≥ 18.17.0
- **npm** ≥ 9.0.0

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces (frontend, backend, shared).

### 2. Set up environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit each `.env` file with your configuration.

### 3. Start development servers

```bash
# Both frontend and backend
npm run dev

# Or individually
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:5000
```

### 4. Build for production

```bash
npm run build
```

## Available Scripts

| Script            | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start all dev servers                          |
| `npm run build`   | Build all packages                             |
| `npm run lint`    | Run ESLint across all workspaces               |
| `npm run format`  | Format all files with Prettier                 |
| `npm run typecheck` | TypeScript type checking across all packages |
| `npm run clean`   | Remove all build artifacts and node_modules    |

## Shared Types

The `shared/` package contains TypeScript interfaces used by both frontend and backend:

- **Student** — Student profile, department, CGPA, placement status
- **Drive** — Company placement drive with eligibility criteria
- **Application** — Student application to a drive with status tracking
- **CustomField** — Dynamic form fields attached to drives
- **ApiResponse** — Standardized API response envelope

Import in either package:

```typescript
import type { Student, Drive, Application } from '@shared/types';
```

## WhatsApp Integration Setup

The backend communicates with a self-hosted **[rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA)** API gateway via REST API to send placement drive alerts to a designated WhatsApp Group.

### 1. Run the OpenWA Gateway (Separate Service)
To spin up your WhatsApp API Gateway, clone and run the OpenWA repo on your server or local machine:
```bash
git clone https://github.com/rmyndharis/OpenWA.git
cd OpenWA
docker compose -f docker-compose.dev.yml up -d
```
Once started, access the Dashboard at `http://localhost:2785` to link your WhatsApp device via QR code and retrieve your API Key.

### 2. Configure Backend Environment
Add the following variables to your `backend/.env` file:
```env
OPENWA_API_URL=http://localhost:2785
OPENWA_API_KEY=your_openwa_api_key
OPENWA_SESSION_ID=placement-buddy
WHATSAPP_GROUP_ID=your_whatsapp_group_id
```

### 3. Fetch Group IDs
To find the ID of the WhatsApp group you want to notify, run the helper script:
```bash
npx tsx backend/scripts/get-whatsapp-groups.ts
```
Copy the target Group ID and update your `WHATSAPP_GROUP_ID` environment variable.

### 4. Health & Status Check
- Access `GET /api/whatsapp/status` to check the current connection state of the WhatsApp session on the gateway.

### 5. Backend Deployment (Standard Docker)
Since the backend only makes REST requests, the container remains extremely lightweight and does not require chromium libraries.
- Build the Docker image:
  ```bash
  docker build -t placement-backend -f Dockerfile .
  ```
- Run the container:
  ```bash
  docker run -p 5000:5000 --env-file backend/.env placement-backend
  ```

## Design System

The frontend follows a strict design system defined in `frontend/DESIGN.md`. Before building any UI component, read DESIGN.md and follow its tokens exactly (colors, spacing, typography, component patterns).

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind, shadcn/ui |
| Backend  | Node.js, Express, TypeScript, Zod                 |
| Shared   | TypeScript interfaces                             |
| Tooling  | ESLint, Prettier, npm workspaces                  |

## License

Private — All rights reserved.
