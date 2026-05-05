namespace GreenhouseGuard.Api.Services;

public class SimulatorState : ISimulatorState
{
    // volatile: background thread and HTTP thread access this field concurrently
    private volatile bool _isRunning = true;
    public bool IsRunning { get => _isRunning; set => _isRunning = value; }
}
