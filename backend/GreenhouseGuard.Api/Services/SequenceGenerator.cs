namespace GreenhouseGuard.Api.Services;

public class SequenceGenerator : ISequenceGenerator
{
    private long _current = 0;

    public long Next() => Interlocked.Increment(ref _current);
}
