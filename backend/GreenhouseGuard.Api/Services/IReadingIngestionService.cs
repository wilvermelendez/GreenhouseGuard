using GreenhouseGuard.Api.Models;

namespace GreenhouseGuard.Api.Services;

public interface IReadingIngestionService
{
    Task<SensorReading> IngestAsync(SensorReading input);
}
