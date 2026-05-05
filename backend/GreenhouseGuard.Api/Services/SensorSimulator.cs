using GreenhouseGuard.Api.Models;

namespace GreenhouseGuard.Api.Services;

public class SensorSimulator(IServiceScopeFactory scopeFactory, ISimulatorState state, ILogger<SensorSimulator> logger) : BackgroundService
{
    private readonly Random _rng = new();
    private int _tick = 0;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(2000, stoppingToken);
            _tick++;

            if (!state.IsRunning) continue;

            var reading = GenerateReading();

            // BackgroundService is a singleton; DbContext is scoped — must create a scope per tick
            using var scope = scopeFactory.CreateScope();
            var ingestion = scope.ServiceProvider.GetRequiredService<IReadingIngestionService>();
            try
            {
                await ingestion.IngestAsync(reading);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Ingestion failed on tick {Tick}; simulator continues", _tick);
            }
        }
    }

    private SensorReading GenerateReading()
    {
        bool spike = _tick > 0 && _tick % 15 == 0;

        return new SensorReading
        {
            Temperature = spike && _rng.Next(3) == 0
                ? 40 + _rng.NextDouble() * 5
                : 22 + (_rng.NextDouble() * 2 - 1),
            Humidity = spike && _rng.Next(3) == 1
                ? 90 + _rng.NextDouble() * 5
                : 60 + (_rng.NextDouble() * 6 - 3),
            Co2 = spike && _rng.Next(3) == 2
                ? 2500 + _rng.NextDouble() * 200
                : 600 + (_rng.NextDouble() * 100 - 50)
        };
    }
}
