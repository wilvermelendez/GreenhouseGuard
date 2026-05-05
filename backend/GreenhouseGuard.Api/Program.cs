using GreenhouseGuard.Api.Data;
using GreenhouseGuard.Api.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IAnomalyDetector, AnomalyDetector>();
builder.Services.AddSingleton<IAnomalyStore, AnomalyStore>();
builder.Services.AddSingleton<ISequenceGenerator, SequenceGenerator>();

builder.Services.AddDbContext<GreenhouseDbContext>(options =>
    options.UseInMemoryDatabase("GreenhouseDb"));

// AllowCredentials() is required for SignalR WebSocket negotiation
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("AllowAngular");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();
