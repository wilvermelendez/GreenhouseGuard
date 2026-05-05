import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private readonly http = inject(HttpClient);

  readonly isRunning$ = new BehaviorSubject<boolean | null>(null);

  constructor() {
    this.http.get<{ isRunning: boolean }>(`${environment.apiBaseUrl}/api/simulator`)
      .pipe(catchError(() => EMPTY))
      .subscribe(r => this.isRunning$.next(r.isRunning));
  }

  toggle() {
    const running = this.isRunning$.getValue();
    const url = `${environment.apiBaseUrl}/api/simulator/${running ? 'stop' : 'start'}`;
    return this.http.post<{ isRunning: boolean }>(url, null)
      .pipe(tap(r => this.isRunning$.next(r.isRunning)));
  }
}
