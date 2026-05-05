using System.Collections.Concurrent;
using GreenhouseGuard.Api.Models;

namespace GreenhouseGuard.Api.Services;

public class AnomalyStore : IAnomalyStore
{
    private const int Capacity = 20;
    private readonly ConcurrentQueue<Anomaly> _queue = new();

    public void Add(Anomaly anomaly)
    {
        _queue.Enqueue(anomaly);
        // loop (not if) because concurrent producers could race past the cap
        while (_queue.Count > Capacity)
            _queue.TryDequeue(out _);
    }

    public IReadOnlyList<Anomaly> GetRecent() =>
        _queue.Reverse().ToList();
}
