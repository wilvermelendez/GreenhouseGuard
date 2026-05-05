import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Anomaly } from '../../models/anomaly.model';
import { AnomalyListComponent } from './anomaly-list.component';

function makeAnomaly(i: number): Anomaly {
  return { id: `id-${i}`, timestamp: new Date().toISOString(), sensorType: 'Temperature', value: i, reason: `Reason ${i}` };
}

describe('AnomalyListComponent', () => {
  let fixture: ComponentFixture<AnomalyListComponent>;
  let component: AnomalyListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnomalyListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnomalyListComponent);
    component = fixture.componentInstance;
  });

  it('shows empty message when anomalies list is empty', () => {
    component.anomalies = [];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty')?.textContent?.trim()).toBe('No anomalies detected.');
  });

  it('does not show empty message when anomalies are present', () => {
    component.anomalies = [makeAnomaly(1)];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty')).toBeNull();
  });

  it('renders the correct number of anomaly items', () => {
    component.anomalies = [makeAnomaly(1), makeAnomaly(2), makeAnomaly(3)];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.item').length).toBe(3);
  });

  it('renders at most 10 items when list exceeds the limit', () => {
    component.anomalies = Array.from({ length: 15 }, (_, i) => makeAnomaly(i));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.item').length).toBe(10);
  });

  it('displays the sensor type badge and reason for each item', () => {
    component.anomalies = [makeAnomaly(1)];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.type-badge')?.textContent?.trim()).toBe('Temperature');
    expect(el.querySelector('.reason')?.textContent?.trim()).toBe('Reason 1');
  });
});
