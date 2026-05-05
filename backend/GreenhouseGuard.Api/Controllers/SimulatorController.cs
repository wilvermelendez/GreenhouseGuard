using GreenhouseGuard.Api.Models;
using GreenhouseGuard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GreenhouseGuard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulatorController(ISimulatorState state) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<SimulatorStatusDto>(StatusCodes.Status200OK)]
    public IActionResult GetStatus() => Ok(new SimulatorStatusDto(state.IsRunning));

    [HttpPost("start")]
    [ProducesResponseType<SimulatorStatusDto>(StatusCodes.Status200OK)]
    public IActionResult Start()
    {
        state.IsRunning = true;
        return Ok(new SimulatorStatusDto(state.IsRunning));
    }

    [HttpPost("stop")]
    [ProducesResponseType<SimulatorStatusDto>(StatusCodes.Status200OK)]
    public IActionResult Stop()
    {
        state.IsRunning = false;
        return Ok(new SimulatorStatusDto(state.IsRunning));
    }
}
