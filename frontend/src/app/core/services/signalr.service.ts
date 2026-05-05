import { Injectable, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Anomaly } from '../../models/anomaly.model';
import { ConnectionStatus } from '../../models/connection-status.model';
import { SensorReading } from '../../models/sensor-reading.model';

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  readonly sensorReading$ = new Subject<SensorReading>();
  readonly anomaly$ = new Subject<Anomaly>();
  readonly connectionStatus$ = new BehaviorSubject<ConnectionStatus>('disconnected');

  private connection: HubConnection | null = null;

  connect(): void {
    // guard against Connecting / Connected / Reconnecting states — not just Connected
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${environment.apiBaseUrl}/hubs/telemetry`)
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReadingReceived', (reading: SensorReading) =>
      this.sensorReading$.next(reading)
    );
    this.connection.on('AnomalyDetected', (anomaly: Anomaly) =>
      this.anomaly$.next(anomaly)
    );

    this.connection.onreconnecting(() => this.connectionStatus$.next('reconnecting'));
    this.connection.onreconnected(() => this.connectionStatus$.next('connected'));
    this.connection.onclose(() => this.connectionStatus$.next('disconnected'));

    this.connection
      .start()
      .then(() => this.connectionStatus$.next('connected'))
      .catch(() => this.connectionStatus$.next('disconnected'));
  }

  disconnect(): void {
    this.connection?.stop();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
