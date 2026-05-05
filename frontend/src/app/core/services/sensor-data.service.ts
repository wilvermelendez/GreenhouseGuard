import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Anomaly } from '../../models/anomaly.model';
import { SensorReading } from '../../models/sensor-reading.model';
import { SignalRService } from './signalr.service';

@Injectable({ providedIn: 'root' })
export class SensorDataService implements OnDestroy {
  private readonly signalR = inject(SignalRService);
  private readonly http    = inject(HttpClient);

  private readonly currentReading$  = new BehaviorSubject<SensorReading | null>(null);
  private readonly anomalies$       = new BehaviorSubject<Anomaly[]>([]);
  private readonly recentReadings$  = new BehaviorSubject<SensorReading[]>([]);
  private readonly subs             = new Subscription();

  constructor() {
    this.signalR.connect();

    this.subs.add(
      this.signalR.sensorReading$.subscribe(r => {
        this.currentReading$.next(r);
        const prev = this.recentReadings$.getValue();
        this.recentReadings$.next([...prev, r].slice(-20));
      })
    );
    this.subs.add(
      this.signalR.anomaly$.subscribe(a => {
        const current = this.anomalies$.getValue();
        this.anomalies$.next([a, ...current].slice(0, 20));
      })
    );

    this.http.get<SensorReading>(`${environment.apiBaseUrl}/api/readings/latest`)
      .pipe(catchError(() => EMPTY))
      .subscribe(r => { if (r) this.currentReading$.next(r); });

    this.http.get<Anomaly[]>(`${environment.apiBaseUrl}/api/anomalies`)
      .pipe(catchError(() => EMPTY))
      .subscribe(list => { if (list?.length) this.anomalies$.next(list); });
  }

  getCurrentReading()  { return this.currentReading$.asObservable(); }
  getAnomalies()       { return this.anomalies$.asObservable(); }
  getRecentReadings()  { return this.recentReadings$.asObservable(); }
  getConnectionStatus() { return this.signalR.connectionStatus$.asObservable(); }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
