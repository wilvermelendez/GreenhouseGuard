import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { pairwise, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SensorReading } from '../../models/sensor-reading.model';
import { SignalRService } from './signalr.service';

const STORAGE_KEY = 'gg.offlineQueue';

@Injectable({ providedIn: 'root' })
export class OfflineQueueService implements OnDestroy {
  private readonly http    = inject(HttpClient);
  private readonly signalR = inject(SignalRService);

  private queue: SensorReading[] = [];
  private draining = false;
  readonly pendingCount$ = new BehaviorSubject<number>(0);
  private readonly subs = new Subscription();

  constructor() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.pendingCount$.next(this.queue.length);
      }
    } catch { /* ignore */ }

    this.subs.add(
      this.signalR.connectionStatus$.pipe(startWith(null), pairwise())
        .subscribe(([prev, curr]) => {
          if (curr === 'connected' && prev !== 'connected') {
            this.drain();
          }
        })
    );
  }

  enqueue(reading: SensorReading): void {
    this.queue.push(reading);
    this.persist();
    this.pendingCount$.next(this.queue.length);
    if (this.signalR.connectionStatus$.getValue() === 'connected') {
      this.drain();
    }
  }

  private drain(): void {
    if (this.draining || this.queue.length === 0) return;
    this.draining = true;
    const snapshot = [...this.queue];
    let settled = 0;
    snapshot.forEach(reading => {
      this.http.post(`${environment.apiBaseUrl}/api/readings`, reading)
        .subscribe({
          next: () => {
            this.queue = this.queue.filter(r => r !== reading);
            this.persist();
            this.pendingCount$.next(this.queue.length);
          },
          error: () => { /* reading stays in queue, retried on next drain */ },
          complete: () => { if (++settled === snapshot.length) this.draining = false; },
        });
    });
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch { /* ignore */ }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
