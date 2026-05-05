# Backend

ASP.NET Core 10 Web API for Greenhouse Guard. Ingests sensor readings, detects anomalies, and streams both in real time over SignalR.

## Stack

| Tool | Purpose |
|---|---|
| .NET 10 / ASP.NET Core | Framework — Controllers, BackgroundService |
| C# 14 | Language |
| EF Core 10 (InMemory) | Persistence — no migrations, swap provider in one line |
| SignalR | Real-time broadcast of readings and anomalies |
| Scalar | API docs (available in Development only) |

## Project structure

```
GreenhouseGuard.Api/
├── Controllers/    # ReadingsController, AnomaliesController, SimulatorController
├── Data/           # GreenhouseDbContext (EF Core)
├── Hubs/           # TelemetryHub (SignalR)
├── Models/         # SensorReading, Anomaly, DTOs
└── Services/       # AnomalyDetector, ReadingIngestionService, SensorSimulator
```

## Run

```bash
cd GreenhouseGuard.Api
dotnet run
```

- API: `http://localhost:5001`
- Scalar docs: `http://localhost:5001/scalar`
- SignalR hub: `ws://localhost:5001/hubs/telemetry`

The `SensorSimulator` background service emits a reading every 2 s and injects random spikes roughly every 15 ticks — no manual POSTing needed to see anomalies.

## Test

```bash
cd ..
dotnet test
```
