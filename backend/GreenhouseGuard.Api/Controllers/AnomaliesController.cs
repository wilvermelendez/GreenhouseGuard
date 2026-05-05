using GreenhouseGuard.Api.Models;
using GreenhouseGuard.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GreenhouseGuard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnomaliesController(IAnomalyStore anomalyStore) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<Anomaly>>(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<Anomaly>> Get() =>
        Ok(anomalyStore.GetRecent());
}
