using GreenhouseGuard.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GreenhouseGuard.Api.Data;

public class GreenhouseDbContext(DbContextOptions<GreenhouseDbContext> options) : DbContext(options)
{
    public DbSet<SensorReading> Readings => Set<SensorReading>();
}
