# Frontend

Angular 21 SPA for Greenhouse Guard. Displays live sensor readings and anomalies pushed over SignalR.

## Stack

| Tool | Purpose |
|---|---|
| Angular 21 | Framework — standalone components, no NgModules |
| TypeScript 5.9 | Language |
| SCSS | Styling — component-scoped, global variables in `styles.scss` |
| `@microsoft/signalr` | WebSocket client — connects to `/hubs/telemetry` |
| `chart.js` + `ng2-charts` | Temperature trend line chart |
| RxJS | Reactive data flow between services and components |

## Project structure

```
src/app/
├── core/services/      # SignalR, sensor data, offline queue
├── features/dashboard/ # Main dashboard view
├── models/             # TypeScript interfaces (SensorReading, Anomaly)
└── shared/components/  # SensorCard, AnomalyList, SensorChart
```

## Dev

```bash
npm install
npm start        # http://localhost:4200 — hot reload enabled
```

Expects the backend running at `http://localhost:5001`. The API base URL is set in `src/environments/environment.development.ts`.

## Build

```bash
npm run build    # production build → dist/frontend/browser/
```

The production environment file (`src/environments/environment.ts`) uses an empty `apiBaseUrl` so the app works behind the Nginx reverse proxy in Docker.

## Test

```bash
ng test --watch=false
```
