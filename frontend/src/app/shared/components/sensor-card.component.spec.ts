import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Thresholds } from '../../models/thresholds.model';
import { SensorCardComponent } from './sensor-card.component';

const THRESHOLDS: Thresholds = { greenMin: 18, greenMax: 28, yellowMin: 15, yellowMax: 32 };

describe('SensorCardComponent', () => {
  let fixture: ComponentFixture<SensorCardComponent>;
  let component: SensorCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SensorCardComponent);
    component = fixture.componentInstance;
    component.thresholds = THRESHOLDS;
    component.label = 'Temperature';
    component.unit = '°C';
    component.accent = 'temperature';
  });

  describe('statusClass', () => {
    it('returns "idle" when value is null', () => {
      component.value = null;
      expect(component.statusClass).toBe('idle');
    });

    it('returns "green" when value is within green range', () => {
      component.value = 23;
      expect(component.statusClass).toBe('green');
    });

    it('returns "yellow" when value is in yellow but outside green range', () => {
      component.value = 16;
      expect(component.statusClass).toBe('yellow');
    });

    it('returns "red" when value is outside yellow range', () => {
      component.value = 5;
      expect(component.statusClass).toBe('red');
    });
  });

  describe('sparklinePoints', () => {
    it('returns empty string when fewer than 2 points', () => {
      component.sparkline = [25];
      expect(component.sparklinePoints).toBe('');
    });

    it('does not throw when all values are equal (guards division by zero)', () => {
      component.sparkline = [20, 20, 20];
      expect(() => component.sparklinePoints).not.toThrow();
    });

    it('first point has x=0 and last point has x=100', () => {
      component.sparkline = [10, 20, 30];
      const pts = component.sparklinePoints.split(' ');
      expect(pts[0].startsWith('0,')).toBe(true);
      expect(pts[pts.length - 1].startsWith('100,')).toBe(true);
    });
  });

  describe('template', () => {
    it('renders a dash when value is null', () => {
      component.value = null;
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.dash')?.textContent?.trim()).toBe('—');
    });

    it('renders the numeric value when provided', () => {
      component.value = 23.5;
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.value')?.textContent).toContain('23.5');
    });

    it('applies the correct status class to the status pill', () => {
      component.value = 23;
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.status-pill')?.classList).toContain('green');
    });
  });
});
