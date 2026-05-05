import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
import { SensorDataService } from '../../core/services/sensor-data.service';
import { SimulatorService } from '../../core/services/simulator.service';
import { Thresholds } from '../../models/thresholds.model';
import { AnomalyListComponent } from '../../shared/components/anomaly-list.component';
import { SensorCardComponent } from '../../shared/components/sensor-card.component';
import { SensorChartComponent } from '../../shared/components/sensor-chart.component';

const THRESHOLDS = {
  temperature: { greenMin: 18, greenMax: 28, yellowMin: 15, yellowMax: 32 } as Thresholds,
  humidity: { greenMin: 50, greenMax: 70, yellowMin: 40, yellowMax: 80 } as Thresholds,
  co2: { greenMin: 400, greenMax: 1000, yellowMin: 300, yellowMax: 1500 } as Thresholds,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, SensorCardComponent, AnomalyListComponent, SensorChartComponent],
  styleUrl: './dashboard.component.scss',
  animations: [
    trigger('overlayAnim', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('panelAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.93) translateY(-10px)' }),
        animate('240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in',
                style({ opacity: 0, transform: 'scale(0.95) translateY(-6px)' })),
      ]),
    ]),
  ],
  template: `
    @let reading    = reading$          | async;
    @let status     = status$           | async;
    @let recent     = recentReadings$   | async;
    @let temps      = tempHistory$      | async;
    @let humidity   = humidHistory$     | async;
    @let co2        = co2History$       | async;
    @let simRunning = simRunning$       | async;

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
              [class.reconnecting]="status === 'reconnecting'"
              [class.offline]="status === 'disconnected'"
            >
              {{ status === 'connected' ? 'LIVE' : status === 'reconnecting' ? 'SYNC' : 'OFFLINE' }}
            </span>
            <span class="badge pending">{{ pendingCount$ | async }} queued</span>
            <button type="button" class="btn-sim" [class.running]="simRunning" (click)="toggleSimulator()">
              {{ simRunning ? '⏸ Simulator' : '▶ Simulator' }}
            </button>
            <button type="button" class="btn-send" (click)="sendManualReading()">+ Reading</button>
            <button type="button" class="btn-send" (click)="openCustomModal()">+ Custom Reading</button>
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

    @if (showModal) {
      <div class="modal-overlay" @overlayAnim (click)="showModal = false" role="dialog" aria-modal="true" aria-label="Add custom reading">
        <div class="modal glass" @panelAnim (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add Custom Reading</h2>
          </div>
          <div class="modal-body">
            <div class="modal-field">
              <label for="draft-temp">Temperature</label>
              <div class="input-wrap">
                <input id="draft-temp" type="number" [(ngModel)]="draft.temperature" min="0" max="50" step="0.1" />
                <span class="unit">°C</span>
              </div>
              <span class="hint">Green 18–28 · Yellow 15–32 · Red outside</span>
            </div>
            <div class="modal-field">
              <label for="draft-humid">Humidity</label>
              <div class="input-wrap">
                <input id="draft-humid" type="number" [(ngModel)]="draft.humidity" min="0" max="100" step="0.1" />
                <span class="unit">%</span>
              </div>
              <span class="hint">Green 50–70 · Yellow 40–80 · Red outside</span>
            </div>
            <div class="modal-field">
              <label for="draft-co2">CO₂</label>
              <div class="input-wrap">
                <input id="draft-co2" type="number" [(ngModel)]="draft.co2" min="0" max="5000" step="1" />
                <span class="unit">ppm</span>
              </div>
              <span class="hint">Green 400–1000 · Yellow 300–1500 · Red outside</span>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-modal-cancel" (click)="showModal = false">Cancel</button>
            <button type="button" class="btn-modal-submit" (click)="submitCustomReading()">Submit Reading</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent {
  private readonly sensorData   = inject(SensorDataService);
  private readonly offlineQueue = inject(OfflineQueueService);
  private readonly simulator    = inject(SimulatorService);

  readonly reading$        = this.sensorData.getCurrentReading();
  readonly status$         = this.sensorData.getConnectionStatus();
  readonly anomalies$      = this.sensorData.getAnomalies();
  readonly recentReadings$ = this.sensorData.getRecentReadings();
  readonly pendingCount$   = this.offlineQueue.pendingCount$;
  readonly simRunning$     = this.simulator.isRunning$;
  readonly thresholds      = THRESHOLDS;

  readonly tempHistory$  = this.recentReadings$.pipe(map(rs => rs.map(r => r.temperature)));
  readonly humidHistory$ = this.recentReadings$.pipe(map(rs => rs.map(r => r.humidity)));
  readonly co2History$   = this.recentReadings$.pipe(map(rs => rs.map(r => r.co2)));

  showModal = false;
  draft = { temperature: 0, humidity: 0, co2: 0 };

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showModal = false;
  }

  toggleSimulator(): void {
    this.simulator.toggle().subscribe({ error: () => {} });
  }

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

  openCustomModal(): void {
    this.draft = {
      temperature: +(20 + Math.random() * 6).toFixed(1),
      humidity: +(52 + Math.random() * 14).toFixed(1),
      co2: +(450 + Math.random() * 450).toFixed(0),
    };
    this.showModal = true;
  }

  submitCustomReading(): void {
    this.offlineQueue.enqueue({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sequenceNumber: 0,
      temperature: +this.draft.temperature,
      humidity: +this.draft.humidity,
      co2: +this.draft.co2,
    });
    this.showModal = false;
  }
}
