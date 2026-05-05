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
    [ProducesResponseType<SensorReading>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SensorReading>> GetLatest()
    {
        var reading = await db.Readings
            .OrderByDescending(r => r.SequenceNumber)
            .FirstOrDefaultAsync();

        return reading is null ? NotFound() : Ok(reading);
    }

    [HttpPost]
    [ProducesResponseType<SensorReading>(StatusCodes.Status201Created)]
    public async Task<ActionResult<SensorReading>> Post([FromBody] SensorReading input)
    {
        var reading = await ingestion.IngestAsync(input);
        return CreatedAtAction(nameof(GetLatest), reading);
    }

    [HttpPost("bulk")]
    [ProducesResponseType<IEnumerable<SensorReading>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SensorReading>>> PostBulk([FromBody] SensorReading[] inputs)
    {
        // sequential — parallel calls would share one DbContext instance which is not thread-safe
        var results = new List<SensorReading>();
        foreach (var input in inputs)
            results.Add(await ingestion.IngestAsync(input));
        return Ok(results);
    }
}
