import { DatePipe, LowerCasePipe, SlicePipe } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { Anomaly } from '../../models/anomaly.model';

@Component({
  selector: 'app-anomaly-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  styleUrl: './anomaly-list.component.scss',
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
      this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }
}
