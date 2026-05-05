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
  styleUrl: './sensor-card.component.scss',
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
