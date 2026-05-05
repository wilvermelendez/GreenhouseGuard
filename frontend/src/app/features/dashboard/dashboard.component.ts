import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
import { SensorDataService } from '../../core/services/sensor-data.service';
import { Thresholds } from '../../models/thresholds.model';
import { AnomalyListComponent } from '../../shared/components/anomaly-list.component';
import { SensorCardComponent } from '../../shared/components/sensor-card.component';
import { SensorChartComponent } from '../../shared/components/sensor-chart.component';

const THRESHOLDS = {
  temperature: { greenMin: 18, greenMax: 28, yellowMin: 15, yellowMax: 32 } as Thresholds,
  humidity: { greenMin: 50, greenMax: 70, yellowMin: 40, yellowMax: 80 } as Thresholds,
  co2: { greenMin: 400, greenMax: 1000, yellowMin: 1000, yellowMax: 1500 } as Thresholds,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, SensorCardComponent, AnomalyListComponent, SensorChartComponent],
  template: `
    @let reading  = reading$        | async;
    @let status   = status$         | async;
    @let recent   = recentReadings$ | async;
    @let temps    = tempHistory$    | async;
    @let humidity = humidHistory$   | async;
    @let co2      = co2History$     | async;

    <div class="app-shell">
      <aside class="sidebar glass" aria-label="Navigation">
        <div class="sidebar-brand" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 3c-4 4-7 7.5-7 11a7 7 0 1 0 14 0c0-3.5-3-7-7-11z"
              stroke="currentColor"
              stroke-width="1.5"
              fill="rgba(74,222,128,0.12)"
            />
            <path d="M12 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-item active">
            <span class="nav-ico" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </span>
            <span class="nav-label">Dashboard</span>
          </div>
        </nav>
      </aside>

      <div class="main">
        <header class="header glass">
          <div class="header-left">
            <h1>Greenhouse Monitor</h1>
          </div>
          <div class="header-right">
            <span
              class="badge"
              [class.live]="status === 'connected'"
              [class.offline]="status !== 'connected'"
            >
              {{ status === 'connected' ? 'LIVE' : 'OFFLINE' }}
            </span>
            @if ((pendingCount$ | async)! > 0) {
              <span class="badge pending">{{ pendingCount$ | async }} queued</span>
            }
            <button type="button" class="btn-send" (click)="sendManualReading()">+ Reading</button>
            @if (reading) {
              <span class="timestamp">Last update: {{ reading.timestamp | date: 'HH:mm:ss' }}</span>
            }
          </div>
        </header>

        <div class="cards">
          <app-sensor-card
            label="Temperature"
            accent="temperature"
            [value]="reading?.temperature ?? null"
            unit="°C"
            [thresholds]="thresholds.temperature"
            [sparkline]="temps    ?? []"
          />
          <app-sensor-card
            label="Humidity"
            accent="humidity"
            [value]="reading?.humidity ?? null"
            unit="%"
            [thresholds]="thresholds.humidity"
            [sparkline]="humidity ?? []"
          />
          <app-sensor-card
            label="CO₂"
            accent="co2"
            [value]="reading?.co2 ?? null"
            unit="ppm"
            [thresholds]="thresholds.co2"
            [sparkline]="co2 ?? []"
          />
        </div>

        <div class="lower">
          <app-sensor-chart class="chart-slot" [readings]="recent ?? []" />
          <app-anomaly-list class="anomaly-slot" [anomalies]="(anomalies$ | async) ?? []" />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .app-shell {
        display: flex;
        min-height: 100vh;
        align-items: stretch;
      }

      .sidebar {
        width: var(--sidebar-width);
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.25rem 0.5rem;
        border-radius: 0;
        border-top: none;
        border-bottom: none;
        border-left: none;
      }

      .sidebar-brand {
        color: var(--color-green);
        margin-bottom: 2rem;
        filter: drop-shadow(0 0 12px var(--color-green-glow));
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        align-items: center;
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        padding: 0.65rem 0.35rem;
        border-radius: var(--radius-md);
        width: 100%;
        color: var(--color-text-muted);
        cursor: default;
      }

      .nav-item.active {
        color: var(--color-text);
        background: var(--color-green-active-bg);
        border: 1px solid var(--color-green-active-border);
        box-shadow: 0 0 24px var(--color-green-active-bg);
      }

      .nav-ico {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-label {
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-align: center;
        line-height: 1.2;
      }

      .main {
        flex: 1;
        min-width: 0;
        padding: 1.25rem 1.5rem 1.75rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 0.9rem 1.25rem;
        border-radius: var(--radius-lg);
      }

      h1 {
        font-size: clamp(1.15rem, 2vw, 1.45rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--color-text);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .badge {
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.12em;
      }

      .live {
        background: var(--color-green-bg);
        color: var(--color-green);
        border: 1px solid var(--color-green-glow);
        box-shadow: 0 0 20px var(--color-green-glow), 0 0 40px var(--color-green-active-bg);
      }

      .offline {
        background: var(--color-offline-bg);
        color: var(--color-text-muted);
        border: 1px solid var(--color-glass-border);
      }

      .pending {
        background: var(--color-amber-bg);
        color: var(--color-amber);
        border: 1px solid var(--color-amber-border);
      }

      .btn-send {
        padding: 0.4rem 0.75rem;
        font-size: 0.72rem;
        font-weight: 600;
        border: 1px solid var(--color-glass-border);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.04);
        cursor: pointer;
        color: var(--color-text-muted);
      }

      .btn-send:hover {
        color: var(--color-text);
        border-color: rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.06);
      }

      .timestamp {
        font-size: 0.8rem;
        color: var(--color-text-dim);
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .lower {
        display: grid;
        grid-template-columns: 1fr minmax(280px, 340px);
        gap: 1.25rem;
        align-items: stretch;
        flex: 1;
        min-height: 0;
      }

      .chart-slot {
        min-width: 0;
      }

      .anomaly-slot {
        min-width: 0;
      }

      @media (max-width: 1024px) {
        .lower {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .app-shell {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
          flex-direction: row;
          justify-content: flex-start;
          padding: 0.75rem 1rem;
          gap: 1rem;
        }

        .sidebar-brand {
          margin-bottom: 0;
        }

        .sidebar-nav {
          flex-direction: row;
          width: auto;
        }

        .nav-item {
          flex-direction: row;
          width: auto;
          padding: 0.5rem 0.85rem;
        }

        .cards {
          grid-template-columns: 1fr;
        }

        .header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-right {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly sensorData = inject(SensorDataService);
  private readonly offlineQueue = inject(OfflineQueueService);

  readonly reading$        = this.sensorData.getCurrentReading();
  readonly status$         = this.sensorData.getConnectionStatus();
  readonly anomalies$      = this.sensorData.getAnomalies();
  readonly recentReadings$ = this.sensorData.getRecentReadings();
  readonly pendingCount$   = this.offlineQueue.pendingCount$;
  readonly thresholds      = THRESHOLDS;

  readonly tempHistory$  = this.sensorData.getRecentReadings().pipe(map(rs => rs.map(r => r.temperature)));
  readonly humidHistory$ = this.sensorData.getRecentReadings().pipe(map(rs => rs.map(r => r.humidity)));
  readonly co2History$   = this.sensorData.getRecentReadings().pipe(map(rs => rs.map(r => r.co2)));

  sendManualReading(): void {
    this.offlineQueue.enqueue({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sequenceNumber: 0,
      temperature: +(22 + Math.random() * 2).toFixed(1),
      humidity: +(60 + Math.random() * 5).toFixed(1),
      co2: +(600 + Math.random() * 50).toFixed(0),
    });
  }
}
