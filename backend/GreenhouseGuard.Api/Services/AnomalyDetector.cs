using GreenhouseGuard.Api.Models;

namespace GreenhouseGuard.Api.Services;

public class AnomalyDetector : IAnomalyDetector
{
    private const int WindowSize = 20;
    private const int MinSamples = 5;
    private const double ZThreshold = 2.5;

    private readonly Queue<double> _tempWindow = new();
    private readonly Queue<double> _humidityWindow = new();
    private readonly Queue<double> _co2Window = new();
    // singleton called from background thread and HTTP threads concurrently; Queue<T> is not thread-safe
    private readonly object _lock = new();

    public IEnumerable<Anomaly> Evaluate(SensorReading reading)
    {
        lock (_lock)
        {
            var anomalies = new List<Anomaly>();

            Check(_tempWindow, reading.Temperature, "Temperature", $"{reading.Temperature:F1}°C", reading.Timestamp, anomalies);
            Check(_humidityWindow, reading.Humidity, "Humidity", $"{reading.Humidity:F1}%", reading.Timestamp, anomalies);
            Check(_co2Window, reading.Co2, "CO2", $"{reading.Co2:F0} ppm", reading.Timestamp, anomalies);

            return anomalies;
        }
    }

    private static void Check(Queue<double> window, double value, string sensorType, string formatted, DateTimeOffset timestamp, List<Anomaly> anomalies)
    {
        if (!double.IsFinite(value))
            return;

        if (window.Count >= WindowSize)
            window.Dequeue();

        // evaluate against the existing window BEFORE adding the current value;
        // including the spike in its own baseline attenuates the z-score
        if (window.Count >= MinSamples)
        {
            var mean = window.Average();
            var stddev = Math.Sqrt(window.Average(v => Math.Pow(v - mean, 2)));

            // guard against near-zero stddev producing nonsensical z-scores
            if (stddev >= 1e-10)
            {
                var z = Math.Abs((value - mean) / stddev);
                if (z > ZThreshold)
                {
                    anomalies.Add(new Anomaly
                    {
                        Id = Guid.NewGuid(),
                        Timestamp = timestamp,
                        SensorType = sensorType,
                        Value = value,
                        Reason = $"{sensorType} spike: {formatted}, z={z:F2}"
                    });
                }
            }
        }

        window.Enqueue(value);
    }
}
