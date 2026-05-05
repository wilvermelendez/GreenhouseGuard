using GreenhouseGuard.Api.Models;
using GreenhouseGuard.Api.Services;

namespace GreenhouseGuard.Api.Tests;

public class AnomalyDetectorTests
{
    [Fact]
    public void AnomalyDetector_WithSpike_ReturnsAnomaly()
    {
        var detector = new AnomalyDetector();
        var now = DateTimeOffset.UtcNow;

        for (int i = 0; i < 20; i++)
        {
            var reading = new SensorReading
            {
                Temperature = 22.0 + (i % 2 == 0 ? 0.3 : -0.3),
                Humidity = 60,
                Co2 = 600,
                Timestamp = now
            };
            detector.Evaluate(reading);
        }

        var spike = new SensorReading
        {
            Temperature = 45.0,
            Humidity = 60,
            Co2 = 600,
            Timestamp = now
        };

        var anomalies = detector.Evaluate(spike).ToList();

        Assert.Single(anomalies);
        Assert.Equal("Temperature", anomalies[0].SensorType);
        Assert.Contains("z=", anomalies[0].Reason);
        var zPart = anomalies[0].Reason.Split("z=")[1];
        Assert.True(double.Parse(zPart) > 2.5);
    }
}
