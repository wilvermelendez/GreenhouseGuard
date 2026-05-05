import { DatePipe, LowerCasePipe, SlicePipe } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { Anomaly } from '../../models/anomaly.model';

@Component({
  selector: 'app-anomaly-list',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, SlicePipe],
  template: `
    <div class="panel glass">
      <div class="anomaly-list">
        <h2>Recent Anomalies</h2>
        @if (anomalies.length === 0) {
          <p class="empty">No anomalies detected.</p>
        } @else {
          <div class="list" #scrollContainer>
            @for (a of anomalies | slice: 0 : 10; track a.id) {
              <div class="item {{ a.sensorType | lowercase }}">
                <div class="item-head">
                  <span class="type-badge">{{ a.sensorType }}</span>
                  <span class="time">{{ a.timestamp | date: 'HH:mm:ss' }}</span>
                </div>
                <p class="reason">{{ a.reason }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .panel {
        height: 100%;
        min-height: 280px;
        border-radius: var(--radius-lg);
        padding: 1rem 1.1rem 1.15rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      }

      .anomaly-list {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }

      h2 {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--color-text-muted);
        margin-bottom: 0.85rem;
      }

      .empty {
        color: var(--color-text-dim);
        font-size: 0.88rem;
        padding: 0.5rem 0;
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        flex: 1;
        max-height: min(820px, 55vh);
        overflow-y: auto;
        padding-right: 0.25rem;
      }

      .list::-webkit-scrollbar {
        width: 6px;
      }
      .list::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.25);
        border-radius: 99px;
      }

      .item {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0.75rem 0.9rem;
        border-radius: var(--radius-md);
        font-size: 0.84rem;
        border: 1px solid var(--color-glass-border);
        background: rgba(15, 18, 26, 0.92);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }

      .item.temperature {
        border-left: 3px solid var(--chart-temp);
        background: linear-gradient(
          90deg,
          rgba(249, 115, 22, 0.12),
          rgba(15, 18, 26, 0.95)
        );
      }
      .item.humidity {
        border-left: 3px solid var(--chart-humidity);
        background: linear-gradient(
          90deg,
          rgba(59, 130, 246, 0.12),
          rgba(15, 18, 26, 0.95)
        );
      }
      .item.co2 {
        border-left: 3px solid var(--chart-co2);
        background: linear-gradient(
          90deg,
          rgba(74, 222, 128, 0.1),
          rgba(15, 18, 26, 0.95)
        );
      }

      .item-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .type-badge {
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .temperature .type-badge {
        background: var(--color-temp-bg);
        color: var(--color-temp);
      }
      .humidity .type-badge {
        background: var(--color-humidity-bg);
        color: var(--color-humidity);
      }
      .co2 .type-badge {
        background: var(--color-co2-bg);
        color: var(--color-co2);
      }

      .reason {
        margin: 0;
        color: var(--color-text-body);
        line-height: 1.45;
        word-break: break-word;
      }

      .time {
        color: var(--color-text-dim);
        font-size: 0.72rem;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class AnomalyListComponent implements OnChanges, AfterViewChecked {
  @Input() anomalies: Anomaly[] = [];
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLElement>;

  private prevLength = 0;
  private shouldScroll = false;

  ngOnChanges(): void {
    if (this.anomalies.length !== this.prevLength) {
      this.shouldScroll = true;
      this.prevLength = this.anomalies.length;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
      this.shouldScroll = false;
    }
  }
}
