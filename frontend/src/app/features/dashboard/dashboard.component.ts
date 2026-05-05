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

      @keyframes live-pulse {
        0%, 100% { box-shadow: 0 0 20px var(--color-green-glow), 0 0 40px var(--color-green-active-bg); }
        50%       { box-shadow: 0 0 32px var(--color-green-glow), 0 0 64px var(--color-green-active-bg); }
      }

      .badge {
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        transition: background 0.4s ease, color 0.4s ease, border-color 0.4s ease;
      }

      .live {
        background: var(--color-green-bg);
        color: var(--color-green);
        border: 1px solid var(--color-green-glow);
        animation: live-pulse 2.4s ease-in-out infinite;
      }

      .offline {
        background: var(--color-offline-bg);
        color: var(--color-text-muted);
        border: 1px solid var(--color-glass-border);
      }

      @keyframes reconnecting-blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.55; }
      }

      .reconnecting {
        background: var(--color-amber-bg);
        color: var(--color-amber);
        border: 1px solid var(--color-amber-border);
        animation: reconnecting-blink 1.1s ease-in-out infinite;
      }

      .pending {
        background: var(--color-amber-bg);
        color: var(--color-amber);
        border: 1px solid var(--color-amber-border);
      }

      .btn-send,
      .btn-sim {
        padding: 0.4rem 0.75rem;
        font-size: 0.72rem;
        font-weight: 600;
        border: 1px solid var(--color-glass-border);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.04);
        cursor: pointer;
        color: var(--color-text-muted);
        transition: color 0.2s ease, background 0.2s ease,
                    border-color 0.2s ease, transform 0.1s ease;
      }

      .btn-send:active,
      .btn-sim:active {
        transform: scale(0.96);
      }

      .btn-send:hover,
      .btn-sim:hover {
        color: var(--color-text);
        border-color: rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.06);
      }

      .btn-sim.running {
        border-color: var(--color-green-active-border);
        color: var(--color-green);
        background: var(--color-green-active-bg);
      }
      .btn-sim.running:hover {
        background: rgba(74, 222, 128, 0.18);
      }

      .timestamp {
        font-size: 0.8rem;
        color: var(--color-text-dim);
      }

      @keyframes slide-up-in {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .header {
        animation: slide-up-in 0.38s ease-out both;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
      }

      .cards > :nth-child(1) { animation: slide-up-in 0.38s 0.07s ease-out both; }
      .cards > :nth-child(2) { animation: slide-up-in 0.38s 0.14s ease-out both; }
      .cards > :nth-child(3) { animation: slide-up-in 0.38s 0.21s ease-out both; }

      .lower {
        display: grid;
        grid-template-columns: 1fr minmax(280px, 340px);
        gap: 1.25rem;
        align-items: stretch;
        flex: 1;
        min-height: 0;
        animation: slide-up-in 0.38s 0.28s ease-out both;
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

        .header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-right {
          justify-content: flex-start;
        }
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }

      .modal {
        width: min(420px, calc(100vw - 2rem));
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .modal-header h2 {
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--color-text);
      }

      .modal-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .modal-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .modal-field label {
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      .input-wrap {
        display: flex;
        align-items: center;
        gap: 0;
        border: 1px solid var(--color-glass-border);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.04);
        overflow: hidden;
      }

      .input-wrap:focus-within {
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.07);
      }

      .input-wrap input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--color-text);
        font-family: inherit;
        min-width: 0;
      }

      .input-wrap input::-webkit-inner-spin-button,
      .input-wrap input::-webkit-outer-spin-button {
        opacity: 0.4;
      }

      .input-wrap .unit {
        padding: 0.5rem 0.75rem 0.5rem 0;
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--color-text-dim);
        white-space: nowrap;
      }

      .hint {
        font-size: 0.65rem;
        color: var(--color-text-dim);
        letter-spacing: 0.02em;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        padding-top: 0.25rem;
      }

      .btn-modal-cancel {
        padding: 0.45rem 0.9rem;
        font-size: 0.72rem;
        font-weight: 600;
        border: 1px solid var(--color-glass-border);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.04);
        cursor: pointer;
        color: var(--color-text-muted);
        font-family: inherit;
        transition: color 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
      }

      .btn-modal-cancel:hover {
        color: var(--color-text);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .btn-modal-cancel:active {
        transform: scale(0.96);
      }

      .btn-modal-submit {
        padding: 0.45rem 0.9rem;
        font-size: 0.72rem;
        font-weight: 600;
        border: 1px solid var(--color-green-active-border);
        border-radius: var(--radius-md);
        background: var(--color-green-active-bg);
        cursor: pointer;
        color: var(--color-green);
        font-family: inherit;
        transition: background 0.2s ease, transform 0.1s ease;
      }

      .btn-modal-submit:hover {
        background: rgba(74, 222, 128, 0.18);
      }

      .btn-modal-submit:active {
        transform: scale(0.96);
      }
    `,
  ],
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
