using GreenhouseGuard.Api.Data;
using GreenhouseGuard.Api.Hubs;
using GreenhouseGuard.Api.Models;
using Microsoft.AspNetCore.SignalR;

namespace GreenhouseGuard.Api.Services;

public class ReadingIngestionService(
    GreenhouseDbContext db,
    IAnomalyDetector detector,
    IAnomalyStore anomalyStore,
    ISequenceGenerator sequenceGenerator,
    IHubContext<TelemetryHub> hub) : IReadingIngestionService
{
    public async Task<SensorReading> IngestAsync(SensorReading input)
    {
        var reading = new SensorReading
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTimeOffset.UtcNow,
            SequenceNumber = sequenceGenerator.Next(),
            Temperature = input.Temperature,
            Humidity = input.Humidity,
            Co2 = input.Co2
        };

        db.Readings.Add(reading);
        await db.SaveChangesAsync();

        await hub.Clients.All.SendAsync("ReadingReceived", reading);

        foreach (var anomaly in detector.Evaluate(reading))
        {
            anomalyStore.Add(anomaly);
            await hub.Clients.All.SendAsync("AnomalyDetected", anomaly);
        }

        return reading;
    }
}
