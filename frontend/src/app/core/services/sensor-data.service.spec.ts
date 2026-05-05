import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Anomaly } from '../../models/anomaly.model';
import { SensorReading } from '../../models/sensor-reading.model';
import { SensorDataService } from './sensor-data.service';
import { SignalRService } from './signalr.service';

describe('SensorDataService', () => {
  let service: SensorDataService;
  let readingSubject: Subject<SensorReading>;
  let anomalySubject: Subject<Anomaly>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    readingSubject = new Subject<SensorReading>();
    anomalySubject = new Subject<Anomaly>();

    const signalRStub: Partial<SignalRService> = {
      sensorReading$: readingSubject as any,
      anomaly$: anomalySubject as any,
      connectionStatus$: new BehaviorSubject<any>('disconnected'),
      connect: () => {},
    };

    TestBed.configureTestingModule({
      providers: [
        SensorDataService,
        { provide: SignalRService, useValue: signalRStub },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SensorDataService);
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne(req => req.url.includes('readings/latest')).flush(null);
    httpMock.expectOne(req => req.url.includes('anomalies')).flush([]);
  });

  afterEach(() => httpMock.verify());

  it('should update current reading when SignalR emits', async () => {
    const fake: SensorReading = {
      id: '1', timestamp: new Date().toISOString(),
      sequenceNumber: 1, temperature: 25, humidity: 60, co2: 700,
    };

    const resultPromise = firstValueFrom(
      service.getCurrentReading().pipe(filter(r => r !== null))
    );

    readingSubject.next(fake);

    const result = await resultPromise;
    expect(result.temperature).toBe(25);
  });
});
