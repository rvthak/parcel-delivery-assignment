# Last-Mile Dispatch Dashboard

A full-stack prototype for a courier company's last-mile parcel sorting system. Manages package creation, warehouse scanning, driver assignment based on delivery postcodes, and real-time readiness tracking.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd parcel-delivery-assignment
   ```

2. **Configure environment variables** (required):
   ```bash
   cp .env.example .env
   ```
   The default values in `.env.example` work out of the box. The application will fail to start without a `.env` file. Edit `.env` if you need to change database credentials or ports.

3. **Build and start the application**:
   ```bash
   docker compose up --build
   ```
   This starts all three services:
   - PostgreSQL database (internal only)
   - Node.js backend API (internal only)
   - React frontend via nginx (exposed on port 3000)

4. **Access the application**: Open [http://localhost:3000](http://localhost:3000)

## Local Development (without Docker)

For faster iteration with hot-reload on both frontend and backend, you can run the services locally while keeping only PostgreSQL in Docker.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL only) — or a local PostgreSQL 16 instance

### 1. Start the database

Start only the PostgreSQL container:
```bash
docker compose up postgres
```

Alternatively, if you have PostgreSQL installed locally, create the database and apply the schema:
```bash
createdb dispatch_db
psql -d dispatch_db -f database/schema.sql
psql -d dispatch_db -f database/seed.sql
```

### 2. Start the backend (with auto-reload)

```bash
cd backend
npm install
npm run dev
```

This uses `tsx watch` to run the TypeScript source directly and restart on file changes. The backend will be available at `http://localhost:3001`.

The dev script automatically loads environment variables from the root `.env` file. Make sure you've run `cp .env.example .env` first (see [Setup Instructions](#setup-instructions)). Override values in `.env` if your local PostgreSQL setup differs.

### 3. Start the frontend (with hot-reload)

```bash
cd frontend
npm install
npm run dev
```

This starts the Vite dev server at `http://localhost:3000` with hot module replacement (HMR) — changes to React components are reflected instantly in the browser without a full reload. API requests to `/api/*` are proxied to the backend at `localhost:3001`.

### Summary

| Service    | Command                  | URL                    | Auto-reload |
|------------|--------------------------|------------------------|-------------|
| Database   | `docker compose up postgres` | localhost:5432    | —           |
| Backend    | `cd backend && npm run dev`  | localhost:3001    | on file save (restart) |
| Frontend   | `cd frontend && npm run dev` | localhost:3000    | HMR (instant) |

## Database Setup

Database schema and seed data are applied automatically when the PostgreSQL container starts for the first time. The SQL files in `database/` are mounted as init scripts:

- `database/schema.sql` - Creates tables (clusters, drivers, parcels) and indexes
- `database/seed.sql` - Inserts 3 clusters (A, B, C) and 3 drivers (Moe, Larry, Curly)

To reset the database completely, remove the Docker volume:
```bash
docker compose down -v
docker compose up --build
```

## Testing the System

### 1. Create a Parcel
- Navigate to **Create Parcel** in the sidebar
- Enter a Voucher ID (e.g., `PKG001`) and a Postcode (e.g., `10041`)
- Valid postcode prefixes: `10` (driver Moe), `11` (driver Larry), `16` (driver Curly)
- Click "Create Parcel" to see the assigned driver

### 2. View Live Status
- Navigate to **Live Status** to see all drivers and their parcel counts
- This view updates in real-time via Server-Sent Events

### 3. Scan a Parcel
- Navigate to **Scan Parcel**
- Enter a voucher ID of a previously created parcel
- Click "Scan Parcel" to mark it as scanned
- Check the Live Status view to see the scanned count update and the "Ready to Depart" badge

### 4. Reset the System
- Navigate to **Reset System**
- Click "Reset System" to delete all parcels
- Drivers and clusters remain intact

## Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│  (nginx:80)  │      │  (node:3001) │      │   (:5432)    │
│  port 3000   │      │  internal    │      │  internal    │
└──────────────┘      └──────────────┘      └──────────────┘
    exposed               internal              internal
```

- Only port 3000 (frontend) is exposed to the host
- Backend and database communicate within Docker's internal network
- nginx proxies `/api/*` requests to the backend

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/postcodes` | List supported postcode prefixes |
| POST | `/parcels` | Create a parcel and auto-assign driver |
| GET | `/drivers` | List all drivers |
| GET | `/events/drivers/:id/stats` | SSE stream of driver parcel stats |
| POST | `/scan` | Mark a parcel as scanned |
| POST | `/reset` | Delete all parcels |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router
- **Backend**: Node.js, TypeScript, Express
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker, Docker Compose, nginx

## Assumptions

- When multiple drivers exist in the same cluster, the first one found is assigned (LIMIT 1)
- The frontend proxies API calls through nginx to avoid CORS issues in production; the backend still has CORS enabled for flexibility
- SSE connections are established per-driver and cleaned up on component unmount
- Postcode validation is done client-side before the API call; the backend also validates against available clusters

## AI Prompts Used

This project was built with AI assistance (Claude) using the full specification document as the prompt. The implementation was generated based on the detailed technical specification provided.
