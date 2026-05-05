using GreenhouseGuard.Api.Data;
using GreenhouseGuard.Api.Models;
using GreenhouseGuard.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GreenhouseGuard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReadingsController(
    GreenhouseDbContext db,
    IAnomalyDetector detector,
    IAnomalyStore anomalyStore,
    ISequenceGenerator sequenceGenerator) : ControllerBase
{
    [HttpGet("latest")]
    public async Task<ActionResult<SensorReading>> GetLatest()
    {
        var reading = await db.Readings
            .OrderByDescending(r => r.SequenceNumber)
            .FirstOrDefaultAsync();

        return reading is null ? NotFound() : Ok(reading);
    }

    [HttpPost]
    public async Task<ActionResult<SensorReading>> Post([FromBody] SensorReading input)
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

        foreach (var anomaly in detector.Evaluate(reading))
            anomalyStore.Add(anomaly);

        return CreatedAtAction(nameof(GetLatest), reading);
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<IEnumerable<SensorReading>>> PostBulk([FromBody] SensorReading[] inputs)
    {
        var readings = inputs.Select(input => new SensorReading
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTimeOffset.UtcNow,
            SequenceNumber = sequenceGenerator.Next(),
            Temperature = input.Temperature,
            Humidity = input.Humidity,
            Co2 = input.Co2
        }).ToList();

        db.Readings.AddRange(readings);
        await db.SaveChangesAsync();

        foreach (var reading in readings)
            foreach (var anomaly in detector.Evaluate(reading))
                anomalyStore.Add(anomaly);

        return Ok(readings);
    }
}
