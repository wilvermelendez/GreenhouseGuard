using GreenhouseGuard.Api.Data;
using GreenhouseGuard.Api.Hubs;
using GreenhouseGuard.Api.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddSingleton<IAnomalyDetector, AnomalyDetector>();
builder.Services.AddSingleton<IAnomalyStore, AnomalyStore>();
builder.Services.AddSingleton<ISequenceGenerator, SequenceGenerator>();
builder.Services.AddSingleton<ISimulatorState, SimulatorState>();
builder.Services.AddScoped<IReadingIngestionService, ReadingIngestionService>();
builder.Services.AddHostedService<SensorSimulator>();

builder.Services.AddDbContext<GreenhouseDbContext>(options =>
    options.UseInMemoryDatabase("GreenhouseDb"));

// AllowCredentials() is required for SignalR WebSocket negotiation
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.MapControllers();
app.MapHub<TelemetryHub>("/hubs/telemetry");

app.Run();
