# Last-Mile Dispatch Dashboard

A full-stack prototype for a courier company's last-mile parcel sorting system. Manages package creation, warehouse scanning, driver assignment based on delivery postcodes, and real-time readiness tracking.
<img width="1263" height="703" alt="image" src="https://github.com/user-attachments/assets/1e883606-fd72-4ec5-a52b-dbd49824fa52" />

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

- The assignment of a package to a driver is done at the time of the package creation, based on the current snapshot of the system (mapping between clusters/postcodes), since the provided problem is static. In a real world scenario, I would expect the match between cluster and postcodes to be dynamic, to allow realocation of resources according to varying workload. In that scenario, the problem becomes substantially more interesting and complex and we probably need some kind of custom heuristic to properly optimize it.
- I didnt add any user authentication, unit/integration tests, linter or prettier  since they were not explicitly requested, so I focused my energy towards the specific scope set by the assignment.
- When multiple drivers exist in the same cluster, the first one found is assigned (doesn't apply to our current dataset since the drivers are supposed to be immutable at the current setup)
- I chose to use SSE as a simple solution for the basic needs of this assignment (one way live communication). I chose to create a single connection per driver so that only the data for one driver gets sent whenever something changes, instead of sending all of the data for all drivers every time (every time you have to send the data you have to make some queries/calculations so it would be a big waste of resources at scale). Creating a connection for each driver has its own issues as well (too many open connections can slow down the servers) but with a proper connection pooling setup (+maybe the addition of pagination on the front end to limit the max connections needed) I feel like it would scale better (althoug none of this really matters for the needs of this assignment)
- My setup has a "development" setup that allows hot reload and easy debugging in order to iterate fast during development and a "basic production" setup that just packs everything into a docker container to be easily and reliably shipped and deployed.

## Work process
1. Read the assignment and spent some time to draw out a draft scetch of the needed systems on excalidraw (users/views/endpoints/db schema)
<img width="1174" height="610" alt="image" src="https://github.com/user-attachments/assets/d037c6e2-0a8d-47f0-86c2-bf7a105d3300" />

2. Wrote down a large prompt describing my drawing's architecture and requirements
```
Your task is to built a full stack prototype that handles parcel creation, scanning, and tracks real time readiness. parcels are first created and then scanned at the warehouse by the appropriate driver.


Database structure: (PostgreSQL)
"clusters" table:
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name VARCHAR(10) NOT NULL UNIQUE,
	postcode_prefix VARCHAR(2) NOT NULL UNIQUE

"drivers" table:
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	cluster_id INT NOT NULL REFERENCES clusters(id) ON DELETE RESTRICT

"parcels" table:
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	voucher_id VARCHAR(50) NOT NULL UNIQUE,
	postcode VARCHAR(5) NOT NULL,
	driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
	scanned_at TIMESTAMP DEFAULT NULL


CREATE INDEX idx_drivers_cluster_id ON drivers(cluster_id);
CREATE INDEX idx_parcels_driver_id ON parcels(driver_id);
CREATE INDEX idx_parcels_prefix_scanned ON parcels(driver_id, scanned_at);
// UNIQUE fields should have indexes by default

Backend endpoints: (Node.js + TypeScript)
	GET /postcodes:
		Returns all currently available postcode prefixes in the network

	POST /parcels:
		Provides a Voucher ID and a Postcode in order to create a new parcel. Based on the first two digits of the postcode (postcode_prefix), the parcel gets assigned to the driver that is responsible for this postcode at the time of the parcel creation. If the Voucher ID already exists, returns an error.

	GET /drivers:
		Returns a list of the drivers that are currently in the system (their IDs and names)

	GET /events/drivers/:driver_id/stats
	SSE connection to get live status updates on a single driver's parcel counts in real time from the back end. Whenever a parcel is scanned, the front end should be updated with the latest information (ARGUMENTS: DRIVER_ID - RETURNS: amount_of_assigned_parcels, amount_of_scanned_parcels for the given DRIVER_ID) Use http 2 for connection pooling to support.

	POST /scan:
		Sets the "scanned_at" timestamp on the parcel with the provided Voucher ID. If the Voucher ID doesnt exist, returns an error.

	POST /reset:
		Drops all of the existing records from the parcels table. Doesnt touch any other table.


Front end (React + typescript):
The front end of the application should function as a simple dashboard containing the views below: (no user authentication should be implemented at this stage since this is a proof of concept prototype)

- View 1: Parcel Creation page: The purpose of this view is to add new parcels to the system. The page should contain a basic input form with the following fields: "Voucher ID", "Postcode". The page should get the list of supported post code prefixes through GET /postcodes and validate that the postcode provided by the user has the same two starting digits of the postcode of the supported postcodes else display a relevant error message. Include input validation for the "Postcode" field to assert that its value is a five digit number. When the "Create parcel" (submit form) button is pressed, the page makes an API call containing the provided information to the POST /parcels endpoint. If the submission was successful, display a green success message banner and allow the user to submit a new parcel. If the submission returns any errors, display an error banner with the relevant message.

- View 2: Live Status page: The purpose of this view is to have a user friendly overview of the drivers that currently exist in the system and the status of their allocated parcels. Create a component that for a given driver, lists: his name, the amount of parcels that have been allocated to him and the amount of those parcels that has been scanned so far. If all of the parcels of a given driver are scanned, then a green badge should appear before the driver's name in the component to indicate that the driver is "Ready to depart". This view should make use of the GET /drivers endpoint to get all of the available drivers and then create an SSE connection to get live status updates on the driver's parcel counts in real time from the back end.

- View 3: Scan voucher page: The purpose of this view is to scan a parcel. This page should contain an input field for a "Voucher ID" and a "Scan voucher" (submit button) button, that send the form information to the backend through POST /scan/{voucher_id}. If the provided Voucher ID doesnt exist on the database, a relevant error message should be displayed.

- View 4: Reset page: This page allows the user to reset the state of the system to its initial state by deleting all existing parcels (drivers and clusters should not be deleted). This is achieved through POST /reset

---

The above application should be setup to deploy and run within a docker environment for ease of deployment. Make sure you follow a standard dockerized 3-tier setup with frontend, backend, and PostgreSQL. implement the needed docker files and a local setup instructions README
```
4. Prompted claude code to convert my draft description into a detailed specification document. (see [SPECIFICATION.md](./SPECIFICATION.md))
5. Reviewed the generated specifications and prompted claude code to implement a first draft of my proposed system.
6. I reviewed the model's work, manually made small tweaks/corrections (refined the UI, removed magic numbers and hardcoded fallbacks that could make errors silent, styled the UI to follow Skroutz's identity, fixed console warnings etc) and iterated on that until I was happy with the overall result. I had claude code reviewing its own code in every step and judging what was needed or what was too much. I commited between every individual change I made and could always go back to a working version if something went wrong, in the end I squashed all the commits to remove the unneded details and have a clean "alpha" release of the app. (I usually like to have each feature be its own single commit so I squash all the sub commits, this helps with cherry picking/rolling things back and keeping the commit list clean and readable on the long term).
Note: I havent kept all individual prompts that I have used to fine tune the results since they are quite a few of them but I can easily describe my work process in more depth if youre interested)

