
**Start of Specification**

---

# Technical Assignment: Last-Mile Dispatch Dashboard - Full Implementation Spec

## Overview
Build a full-stack prototype for a courier company's last-mile parcel sorting system. The system manages package creation, warehouse scanning, driver assignment based on delivery postcodes, and real-time readiness tracking.

**Tech Stack**: Node.js, TypeScript, PostgreSQL, React, Docker

**Architecture**: Dockerized 3-tier setup (Frontend → Backend → PostgreSQL)

---

## Database Design (PostgreSQL)

### Schema Definition

```sql
-- Clusters Table
CREATE TABLE clusters (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE,
    postcode_prefix VARCHAR(2) NOT NULL UNIQUE
);

-- Drivers Table
CREATE TABLE drivers (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cluster_id INT NOT NULL REFERENCES clusters(id) ON DELETE RESTRICT
);

-- Parcels Table
CREATE TABLE parcels (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    voucher_id VARCHAR(50) NOT NULL UNIQUE,
    postcode VARCHAR(5) NOT NULL,
    driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    scanned_at TIMESTAMP DEFAULT NULL
);

-- Indexes
CREATE INDEX idx_drivers_cluster_id ON drivers(cluster_id);
CREATE INDEX idx_parcels_driver_id ON parcels(driver_id);
CREATE INDEX idx_parcels_scanned_at ON parcels(scanned_at);
```

### Seed Data (Required Initial State)

```sql
-- Insert predefined clusters
INSERT INTO clusters (name, postcode_prefix) VALUES 
    ('A', '10'),
    ('B', '11'),
    ('C', '16');

-- Insert predefined drivers
INSERT INTO drivers (name, cluster_id) VALUES 
    ('Moe', (SELECT id FROM clusters WHERE name = 'A')),
    ('Larry', (SELECT id FROM clusters WHERE name = 'B')),
    ('Curly', (SELECT id FROM clusters WHERE name = 'C'));
```

### Business Logic Notes
- **Driver Assignment**: When a parcel is created, extract the first 2 digits of the postcode using `LEFT(postcode, 2)` and match against `clusters.postcode_prefix` to find the cluster, then assign to a driver in that cluster.
- **Multiple Drivers Per Cluster**: The schema allows multiple drivers per cluster for future expandability. If multiple drivers exist for a cluster, assign to any one of them (implementation choice).
- **Clusters and Drivers**: These are predefined and cannot be edited or deleted via the API.

---

## Backend API (Node.js + TypeScript)

### Technology Requirements
- **HTTP/2**: The backend server must support HTTP/2. Use the simplest setup appropriate for this prototype (h2c or https with self-signed certificates).
- **Framework**: Express.js or similar
- **Database Client**: `pg` or similar PostgreSQL client
- **TypeScript**: Strict mode recommended

### API Endpoints

#### 1. GET /postcodes
**Purpose**: Returns all available postcode prefixes in the system

**Response**: `200 OK`
```json
["10", "11", "16"]
```

**Error Responses**:
- `500 Internal Server Error`: Database error
```json
{
  "error": "Failed to fetch postcode prefixes"
}
```

---

#### 2. POST /parcels
**Purpose**: Create a new parcel and assign it to the appropriate driver based on postcode prefix

**Request Body**:
```json
{
  "voucher_id": "A1A",
  "postcode": "10041"
}
```

**Success Response**: `201 Created`
```json
{
  "assigned_driver": {
    "id": 1,
    "name": "Moe"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Voucher ID already exists
```json
{
  "error": "Voucher ID already exists"
}
```

- `400 Bad Request`: No driver found for postcode prefix
```json
{
  "error": "No driver available for postcode prefix '99'"
}
```

- `500 Internal Server Error`: Database error
```json
{
  "error": "Failed to create parcel"
}
```

---

#### 3. GET /drivers
**Purpose**: Returns all drivers currently in the system

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Moe"
  },
  {
    "id": 2,
    "name": "Larry"
  },
  {
    "id": 3,
    "name": "Curly"
  }
]
```

**Error Responses**:
- `500 Internal Server Error`: Database error
```json
{
  "error": "Failed to fetch drivers"
}
```

---

#### 4. GET /events/drivers/:driver_id/stats
**Purpose**: Server-Sent Events (SSE) endpoint providing real-time updates on driver parcel statistics

**SSE Event Data Format**:
```json
{
  "driver_id": 1,
  "assigned_count": 5,
  "scanned_count": 3
}
```

**Behavior**:
- Sends initial stats immediately upon connection
- Sends updated stats whenever a parcel assigned to this driver is scanned
- Connection remains open until client disconnects
- Each driver requires a separate SSE connection

**Error Responses**:
- `404 Not Found`: Driver doesn't exist
```json
{
  "error": "Driver not found"
}
```

---

#### 5. POST /scan
**Purpose**: Mark a parcel as scanned by setting its `scanned_at` timestamp

**Request Body**:
```json
{
  "voucher_id": "A1A"
}
```

**Success Response**: `200 OK`
```json
{
  "success": true
}
```

**Error Responses**:
- `404 Not Found`: Voucher ID doesn't exist
```json
{
  "error": "Voucher ID not found"
}
```

- `400 Bad Request`: Parcel already scanned
```json
{
  "error": "Parcel already scanned"
}
```

- `500 Internal Server Error`: Database error
```json
{
  "error": "Failed to scan parcel"
}
```

---

#### 6. POST /reset
**Purpose**: Reset system to initial state by deleting all parcels (for testing purposes)

**Request Body**: None

**Success Response**: `200 OK`
```json
{
  "success": true,
  "deleted_count": 12
}
```

**Error Responses**:
- `500 Internal Server Error`: Database error
```json
{
  "error": "Failed to reset system"
}
```

---

## Frontend (React + TypeScript)

### Architecture
- **Framework**: React 18+ with TypeScript
- **Routing**: React Router - each view is a separate route accessible via sidebar navigation
- **State Management**: Not required - use local component state only
- **Styling**: Your choice (CSS Modules, Tailwind, styled-components, etc.)
- **Layout**: Sidebar navigation with 4 tabs/views

### Views

#### View 1: Parcel Creation (`/create`)
**Purpose**: Add new parcels to the system

**UI Components**:
- Input field: "Voucher ID" (text input, required)
- Input field: "Postcode" (text input, required)
- Submit button: "Create Parcel"
- Banner area for success/error messages with manual close button

**Validation**:
1. **Postcode Format**: Must be exactly 5 digits (validate with regex: `/^\d{5}$/`)
2. **Postcode Prefix**: First 2 digits must match one of the supported prefixes from `GET /postcodes`
   - If invalid, display error: "Postcode prefix not supported. Valid prefixes: 10, 11, 16"
3. **Required Fields**: Both fields must be non-empty

**Behavior**:
1. On page load, fetch supported postcode prefixes via `GET /postcodes`
2. On form submission:
   - Validate inputs
   - Call `POST /parcels` with voucher_id and postcode
   - **On Success (201)**:
     - Display green success banner: "Parcel created successfully! Assigned to driver: [Driver Name]"
     - Clear form fields automatically
     - Banner has manual close button (X)
   - **On Error (4xx/5xx)**:
     - Display red error banner with the error message from API response
     - Keep form fields populated
     - Banner has manual close button (X)

**Example Success Message**: 
```
✓ Parcel created successfully! Assigned to driver: Moe 
```

---

#### View 2: Live Status Dashboard (`/status`)
**Purpose**: Real-time overview of all drivers and their parcel statuses

**UI Components**:
- List of driver status cards, one per driver
- Each card displays:
  - Driver name
  - Assigned parcels count
  - Scanned parcels count
  - "Ready to Depart" indicator (green badge) when all parcels are scanned

**Driver Card Layout**:
```
[Green Badge (if ready)] Driver Name | Assigned: 5 | Scanned: 3
```

**"Ready to Depart" Logic**:
- Badge appears when: `scanned_count === assigned_count AND assigned_count > 0`
- Badge hidden when: `scanned_count < assigned_count OR assigned_count === 0`

**Real-Time Updates**:
1. On page load:
   - Fetch all drivers via `GET /drivers`
   - For each driver, establish SSE connection to `GET /events/drivers/:driver_id/stats`
   - Display initial stats
2. SSE connections remain open when switching to other tabs (don't close connections)
3. When SSE event received, update the corresponding driver's stats in real-time
4. On unmount (leaving the app entirely), close all SSE connections

---

#### View 3: Scan Parcel (`/scan`)
**Purpose**: Scan parcels at the warehouse

**UI Components**:
- Input field: "Voucher ID" (text input, required)
- Submit button: "Scan Parcel"
- Banner area for success/error messages

**Behavior**:
1. On form submission:
   - Call `POST /scan` with voucher_id in request body
   - **On Success (200)**:
     - Display green success banner: "Parcel scanned successfully!"
     - Clear input field
   - **On Error (404)**:
     - Display red error banner: "Voucher ID not found"
     - Keep input field populated
   - **On Error (400 - already scanned)**:
     - Display yellow warning banner: "Parcel already scanned"
   - **On Error (5xx)**:
     - Display red error banner with API error message

---

#### View 4: Reset System (`/reset`)
**Purpose**: Reset system to initial state for testing

**UI Components**:
- Warning message explaining this will delete all parcels
- Confirmation button: "Reset System"
- Banner area for success/error messages

**Behavior**:
1. Display prominent warning: "⚠️ This will delete all parcels from the system. Drivers and clusters will not be affected."
2. On button click:
   - Call `POST /reset`
   - **On Success (200)**:
     - Display green success banner: "System reset successfully. [X] parcels deleted."
   - **On Error (5xx)**:
     - Display red error banner with API error message

---

## Docker Configuration

### Container Architecture
1. **Frontend Container**: React app (port 3000 - **exposed to host**)
2. **Backend Container**: Node.js API (port 3001 - **internal only**)
3. **PostgreSQL Container**: Database (port 5432 - **internal only**)

### Network Isolation
- Only the frontend port (3000) should be accessible from outside the Docker network
- Backend and database communicate only within Docker's internal network
- Frontend connects to backend via internal Docker networking

### Required Files
1. `Dockerfile` for backend
2. `Dockerfile` for frontend
3. `docker-compose.yml` orchestrating all three services
4. `.env` file for environment variables (database credentials, ports, etc.)

### Environment Variables
Define in `.env` or `docker-compose.yml`:
```
POSTGRES_USER=dispatch_user
POSTGRES_PASSWORD=dispatch_password
POSTGRES_DB=dispatch_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

---

## Deliverables & Documentation

### README.md Structure
Include clear instructions for:

1. **Prerequisites**: Docker, Docker Compose, Node.js versions
2. **Setup Instructions**:
   - Clone repository
   - Configure environment variables
   - Run `docker-compose up --build`
3. **Database Setup**: How migrations/schema and seed data are applied
4. **Accessing the Application**: URL to access frontend (http://localhost:3000)
5. **Testing the System**: 
   - Step-by-step guide to create parcels, scan them, and see live updates
   - How to use the reset endpoint
6. **Assumptions Made**: Any design decisions or assumptions during development
7. **AI Prompts Used**: Document any AI assistance prompts used during development

### Code Structure Recommendations
```
/project-root
  /backend
    /src
      /routes
      /controllers
      /db
      /types
    Dockerfile
    package.json
    tsconfig.json
  /frontend
    /src
      /components
      /pages
      /services
    Dockerfile
    package.json
    tsconfig.json
  /database
    schema.sql
    seed.sql
  docker-compose.yml
  .env.example
  README.md
```

---

## Additional Technical Notes

### CORS Configuration
Backend must enable CORS to accept requests from the frontend container.

### Error Handling
All API endpoints should implement proper try-catch blocks and return appropriate HTTP status codes.

### TypeScript Types
Define shared types/interfaces for:
- Parcel
- Driver
- Cluster
- API request/response payloads

### Database Connection Pooling
Use connection pooling for PostgreSQL connections to handle concurrent requests efficiently.

### SSE Implementation Notes
- Set appropriate headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Send heartbeat comments every 30 seconds to keep connection alive: `: heartbeat\n\n`
- Handle client disconnections gracefully

---

## Success Criteria

The implementation is successful when:
1. ✅ All 6 API endpoints work as specified
2. ✅ All 4 frontend views render and function correctly
3. ✅ Parcels are correctly assigned to drivers based on postcode prefix
4. ✅ Real-time updates work via SSE when parcels are scanned
5. ✅ "Ready to Depart" badge appears when all driver's parcels are scanned
6. ✅ System can be reset to initial state (3 drivers, 3 clusters, 0 parcels)
7. ✅ Application runs entirely in Docker with proper network isolation
8. ✅ Frontend accessible at localhost:3000, backend and DB not directly accessible from host

---

**End of Specification**