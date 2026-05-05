using Microsoft.AspNetCore.SignalR;

namespace GreenhouseGuard.Api.Hubs;

// server-only broadcasts — no client-callable methods needed
public class TelemetryHub : Hub { }
