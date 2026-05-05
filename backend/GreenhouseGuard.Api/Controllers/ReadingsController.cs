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
    IReadingIngestionService ingestion) : ControllerBase
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
        var reading = await ingestion.IngestAsync(input);
        return CreatedAtAction(nameof(GetLatest), reading);
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<IEnumerable<SensorReading>>> PostBulk([FromBody] SensorReading[] inputs)
    {
        var readings = await Task.WhenAll(inputs.Select(ingestion.IngestAsync));
        return Ok(readings);
    }
}
