export interface SensorReading {
  id: string;
  timestamp: string;
  sequenceNumber: number;
  temperature: number;
  humidity: number;
  co2: number;
}
