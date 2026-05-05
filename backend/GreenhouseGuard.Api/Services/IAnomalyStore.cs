using GreenhouseGuard.Api.Models;

namespace GreenhouseGuard.Api.Services;

public interface IAnomalyStore
{
    void Add(Anomaly anomaly);
    IReadOnlyList<Anomaly> GetRecent();
}
