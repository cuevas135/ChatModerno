using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ChatSalaModern.Services;

public sealed class RoomCleanupWorker : BackgroundService
{
    private readonly ChatRoomStorePro _store;
    private readonly ILogger<RoomCleanupWorker> _logger;

    public RoomCleanupWorker(ChatRoomStorePro store, ILogger<RoomCleanupWorker> logger)
    {
        _store = store;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Limpia cada X minutos
        var interval = TimeSpan.FromMinutes(10);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var removed = _store.CleanupInactiveRooms();
                if (removed > 0)
                    _logger.LogInformation("Cleanup: {Removed} salas inactivas eliminadas.", removed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en cleanup de salas.");
            }

            await Task.Delay(interval, stoppingToken);
        }
    }
}
