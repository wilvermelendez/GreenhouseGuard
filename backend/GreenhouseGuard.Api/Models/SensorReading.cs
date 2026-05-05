namespace GreenhouseGuard.Api.Models;

public class SensorReading
{
    public Guid Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public long SequenceNumber { get; set; }
    public double Temperature { get; set; }
    public double Humidity { get; set; }
    public double Co2 { get; set; }
}
