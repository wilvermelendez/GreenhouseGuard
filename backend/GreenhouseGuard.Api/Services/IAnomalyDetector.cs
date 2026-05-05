using GreenhouseGuard.Api.Models;

namespace GreenhouseGuard.Api.Services;

public interface IAnomalyDetector
{
    IEnumerable<Anomaly> Evaluate(SensorReading reading);
}
