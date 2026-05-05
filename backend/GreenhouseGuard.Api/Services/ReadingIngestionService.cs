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
    IHubContext<TelemetryHub> hub,
    ILogger<ReadingIngestionService> logger) : IReadingIngestionService
{
    public async Task<SensorReading> IngestAsync(SensorReading input)
    {
        // server assigns id, timestamp, and sequence — client values are untrusted
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

        try { await hub.Clients.All.SendAsync("ReadingReceived", reading); }
        catch (Exception ex) { logger.LogWarning(ex, "SignalR broadcast failed for ReadingReceived"); }

        foreach (var anomaly in detector.Evaluate(reading))
        {
            anomalyStore.Add(anomaly);
            try { await hub.Clients.All.SendAsync("AnomalyDetected", anomaly); }
            catch (Exception ex) { logger.LogWarning(ex, "SignalR broadcast failed for AnomalyDetected"); }
        }

        return reading;
    }
}
