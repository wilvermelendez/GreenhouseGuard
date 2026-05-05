using System.ComponentModel.DataAnnotations;

namespace GreenhouseGuard.Api.Models;

public class SensorReading
{
    public Guid Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public long SequenceNumber { get; set; }
    [Range(-50, 80)]   public double Temperature { get; set; }
    [Range(0, 100)]    public double Humidity    { get; set; }
    [Range(0, 10000)]  public double Co2         { get; set; }
}
