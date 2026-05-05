# Greenhouse Guard

Real-time greenhouse sensor monitoring dashboard built with .NET 10 + Angular 21.

## Prerequisites

- .NET 10 SDK
- Node.js 22+
- Docker + Docker Compose (optional, for containerized run)

## Run with Docker

```bash
docker compose up --build
```

- App: `http://localhost:8080`

## Run (one command)

```bash
npm install
npm run dev
```

Starts the backend on `http://localhost:5001` and the frontend on `http://localhost:4200` with hot reload on both.

## Run individually

### Backend

```bash
cd backend/GreenhouseGuard.Api
dotnet run
```

- API: `http://localhost:5001`
- Scalar docs: `http://localhost:5001/scalar`
- SignalR hub: `ws://localhost:5001/hubs/telemetry`

### Frontend

```bash
cd frontend
npm install
npm start
```

- App: `http://localhost:4200`

## Run tests

```bash
# Backend
dotnet test

# Frontend
cd frontend && ng test --watch=false
```

## Assumptions

- **Spec says .NET 8+, this uses .NET 10.** .NET 10 is current LTS; all required APIs (Controllers, EF Core in-memory, SignalR, BackgroundService) are identical. Downgrading is a `<TargetFramework>` change plus a package version sync — no logic changes.
- **"Minimal API Endpoints" in the spec** is read as "a minimal *set* of endpoints", not the .NET Minimal API style. Controllers were chosen for clearer separation of concerns and easier testability.
- **In-memory database only.** EF Core `UseInMemoryDatabase` — no migrations, no file. Swapping to SQLite or Postgres is a one-line provider change.
- **Self-driving simulator.** A `BackgroundService` emits readings every 2 s and injects random spikes roughly every 15 ticks. The `POST /api/readings` endpoint still exists per spec.
- **Per-sensor z-score anomaly detection.** Three independent rolling windows (20 readings each) — one per sensor type. Threshold: |z| > 2.5.
- **Anomalies are in-memory only** (last 20 in a ring buffer). DB persistence of anomalies is explicitly skipped per spec.
- **No client heartbeat.** SignalR's built-in connection state drives the LIVE/OFFLINE badge.
- **Color thresholds:**
  - Temperature: green 18–28 °C / yellow 15–18 or 28–32 / red outside
  - Humidity: green 50–70 % / yellow 40–50 or 70–80 / red outside
  - CO₂: green 400–1000 ppm / yellow 1000–1500 / red > 1500

## What I'd improve

- Persist anomalies to the DB with pagination
- Replace z-score with EWMA + seasonal baselines per sensor
- Multiple greenhouses using SignalR hub groups (`Clients.Group(greenhouseId)`)
- JWT authentication and hub authorization
- IndexedDB-backed offline queue with conflict resolution; Service Worker for full PWA
- Integration tests with `WebApplicationFactory`; E2E with Playwright
- Structured logging (Serilog) and OpenTelemetry traces across HTTP + SignalR
- Backpressure handling on the hub for high reading rates
