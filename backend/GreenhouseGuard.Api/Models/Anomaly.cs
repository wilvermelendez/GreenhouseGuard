namespace GreenhouseGuard.Api.Models;

public class Anomaly
{
    public Guid Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string SensorType { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Reason { get; set; } = string.Empty;
}
