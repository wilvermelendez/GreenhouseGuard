import { DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Thresholds } from '../../models/thresholds.model';

@Component({
  selector: 'app-sensor-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, NgClass],
  template: `
    <div class="card" [ngClass]="[statusClass, 'accent-' + accent]">
      <div class="card-inner">
        <div class="label">{{ label }}</div>
        <div class="mid-row">
          <div class="value-block">
            @if (value !== null) {
              <span class="value"
                >{{ value | number:'1.1-1' }}<span class="unit">{{ unit }}</span></span
              >
            } @else {
              <span class="value dash">—</span>
            }
          </div>
          @if (sparklineValid) {
            <svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" [attr.stop-color]="sparkGradientTop" stop-opacity="0.35" />
                  <stop offset="100%" [attr.stop-color]="sparkGradientTop" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polygon class="spark-fill" [attr.points]="sparkFillPoints" [attr.fill]="'url(#' + gradId + ')'" />
              <polyline class="spark-line" [attr.points]="sparklinePoints" fill="none" />
            </svg>
          }
        </div>
        <div class="status-pill" [ngClass]="statusClass">{{ statusLabel }}</div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      position: relative;
      padding: 1.15rem 1.25rem;
      border-radius: var(--radius-lg, 14px);
      border: 1px solid var(--color-glass-border);
      background: var(--color-surface);
      backdrop-filter: blur(var(--glass-blur, 12px));
      -webkit-backdrop-filter: blur(var(--glass-blur, 12px));
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
      text-align: left;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      transition: border-color 0.55s ease, box-shadow 0.55s ease;
    }

    .card-inner { display: flex; flex-direction: column; gap: 0.65rem; flex: 1; }

    .label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-muted);
    }

    .mid-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem;
      flex: 1;
    }

    .value-block { min-width: 0; }

    .value {
      font-size: clamp(1.75rem, 4vw, 2.35rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.1;
      transition: color 0.5s ease;
    }
    .dash {
      font-size: 2rem;
      font-weight: 500;
      color: var(--color-text-dim);
    }
    .unit {
      font-size: 1rem;
      font-weight: 500;
      margin-left: 0.2rem;
      opacity: 0.75;
    }

    .spark {
      width: 96px;
      height: 44px;
      flex-shrink: 0;
      opacity: 0.92;
    }
    .spark-line {
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    .accent-temperature .spark-line { stroke: var(--chart-temp); }
    .accent-humidity .spark-line { stroke: var(--chart-humidity); }
    .accent-co2 .spark-line { stroke: var(--chart-co2); }

    .status-pill {
      align-self: flex-start;
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: background 0.5s ease, color 0.5s ease, box-shadow 0.5s ease;
    }
    .status-pill.green {
      background: rgba(74, 222, 128, 0.18);
      color: var(--color-green);
      box-shadow: 0 0 20px rgba(74, 222, 128, 0.12);
    }
    .status-pill.yellow {
      background: rgba(250, 204, 21, 0.15);
      color: var(--color-yellow);
    }
    .status-pill.red {
      background: rgba(248, 113, 113, 0.15);
      color: var(--color-red);
    }
    .status-pill.idle {
      background: rgba(100, 116, 139, 0.2);
      color: var(--color-text-dim);
    }

    .card.green {
      border-color: rgba(74, 222, 128, 0.35);
      box-shadow: 0 0 32px rgba(74, 222, 128, 0.06), 0 4px 24px rgba(0, 0, 0, 0.35);
    }
    .card.green .value { color: var(--color-text); }

    .card.yellow { border-color: rgba(250, 204, 21, 0.45); }
    .card.yellow .value { color: var(--color-yellow); }

    .card.red {
      border-color: rgba(248, 113, 113, 0.45);
      box-shadow: 0 0 28px rgba(239, 68, 68, 0.08), 0 4px 24px rgba(0, 0, 0, 0.35);
    }
    .card.red .value { color: var(--color-red); }

    .card.idle { border-color: rgba(100, 116, 139, 0.35); }
    .card.idle .value { color: var(--color-text-muted); }
  `],
})
export class SensorCardComponent {
  private static seq = 0;

  @Input() label = '';
  @Input() value: number | null = null;
  @Input() unit = '';
  @Input({ required: true }) thresholds!: Thresholds;
  @Input() sparkline: number[] = [];
  @Input() accent: 'temperature' | 'humidity' | 'co2' = 'temperature';

  readonly gradId = `sparkGrad-${SensorCardComponent.seq++}`;

  get sparkGradientTop(): string {
    switch (this.accent) {
      case 'humidity':
        return 'var(--chart-humidity)';
      case 'co2':
        return 'var(--chart-co2)';
      default:
        return 'var(--chart-temp)';
    }
  }

  get sparklineValid(): boolean {
    return this.sparkline.length >= 2;
  }

  get sparklinePoints(): string {
    const pts = this.sparkline;
    if (pts.length < 2) return '';
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const padY = 4;
    const h = 40 - padY * 2;
    return pts
      .map((v, i) => {
        const x = pts.length === 1 ? 50 : (i / (pts.length - 1)) * 100;
        const ny = padY + h - ((v - min) / range) * h;
        return `${x},${ny}`;
      })
      .join(' ');
  }

  get sparkFillPoints(): string {
    const line = this.sparklinePoints;
    if (!line) return '';
    return `0,40 ${line} 100,40`;
  }

  get statusClass(): string {
    if (this.value === null) return 'idle';
    const v = this.value;
    const t = this.thresholds;
    if (v >= t.greenMin && v <= t.greenMax) return 'green';
    if (v >= t.yellowMin && v <= t.yellowMax) return 'yellow';
    return 'red';
  }

  get statusLabel(): string {
    switch (this.statusClass) {
      case 'green':
        return 'OK';
      case 'yellow':
        return 'Caution';
      case 'red':
        return 'Alert';
      default:
        return '—';
    }
  }
}
