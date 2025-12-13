using System.Collections.Concurrent;

namespace ChatSalaModern.Services;

/// <summary>
/// Servicio anti-abuso (anti-spam) en memoria.
/// 
/// Se encarga de:
/// - Limitar el envío de BUZZ (zumbidos)
/// - Limitar la creación rápida de salas nuevas
/// - Aplicar bloqueos temporales por ventana de tiempo
/// 
/// No usa Redis:
/// - Es liviano
/// - Ideal para demos / hosting gratuito
/// - El bloqueo se pierde si la app se reinicia (aceptable en este escenario)
/// </summary>
public sealed class ChatAbuseGuard
{
    /// <summary>
    /// Contador interno por clave (usuario / conexión / IP).
    /// 
    /// - Count: cantidad de acciones dentro de la ventana
    /// - WindowStartUtc: inicio de la ventana de tiempo
    /// - BlockedUntilUtc: fecha hasta la que el usuario está bloqueado
    /// </summary>
    private sealed class Counter
    {
        public int Count;
        public DateTimeOffset WindowStartUtc;
        public DateTimeOffset? BlockedUntilUtc;
    }

    // Diccionario para controlar spam de BUZZ
    // key = identificador del usuario (ConnectionId + user / IP)
    private readonly ConcurrentDictionary<string, Counter> _buzz = new();

    // Diccionario para controlar spam de creación de salas nuevas
    private readonly ConcurrentDictionary<string, Counter> _newRooms = new();

    // =========================================================
    // CONFIGURACIÓN DE LÍMITES (ajustable según tu necesidad)
    // =========================================================

    // Ventana de tiempo para BUZZ
    private static readonly TimeSpan BuzzWindow = TimeSpan.FromSeconds(20);

    // Máximo permitido de BUZZ en la ventana
    private const int BuzzMaxInWindow = 3; // 3 zumbidos en 20 segundos

    // Tiempo de bloqueo al exceder el límite de BUZZ
    private static readonly TimeSpan BuzzBlock = TimeSpan.FromSeconds(30); // bloquea 30s

    // Ventana de tiempo para creación de salas nuevas
    private static readonly TimeSpan NewRoomWindow = TimeSpan.FromMinutes(2);

    // Máximo de salas nuevas permitidas en la ventana
    private const int NewRoomMaxInWindow = 4; // 4 salas en 2 minutos

    // Tiempo de bloqueo por spam de salas nuevas
    private static readonly TimeSpan NewRoomBlock = TimeSpan.FromMinutes(2); // bloquea 2 min

    // =========================================================

    /// <summary>
    /// Indica si el usuario está actualmente bloqueado por spam de BUZZ.
    /// Devuelve el tiempo restante de bloqueo.
    /// </summary>
    public bool IsBuzzBlocked(string key, out TimeSpan remaining)
        => IsBlocked(_buzz, key, out remaining);

    /// <summary>
    /// Indica si el usuario está actualmente bloqueado por spam de creación de salas.
    /// Devuelve el tiempo restante de bloqueo.
    /// </summary>
    public bool IsNewRoomBlocked(string key, out TimeSpan remaining)
        => IsBlocked(_newRooms, key, out remaining);

    /// <summary>
    /// Registra un intento de BUZZ.
    /// 
    /// - Si aún está dentro del límite → true
    /// - Si excede el límite → false y aplica bloqueo
    /// </summary>
    public bool TryConsumeBuzz(string key, out TimeSpan? blockedFor)
        => TryConsume(_buzz, key, BuzzWindow, BuzzMaxInWindow, BuzzBlock, out blockedFor);

    /// <summary>
    /// Registra un intento de creación de sala nueva.
    /// 
    /// - Si aún está dentro del límite → true
    /// - Si excede el límite → false y aplica bloqueo
    /// </summary>
    public bool TryConsumeNewRoom(string key, out TimeSpan? blockedFor)
        => TryConsume(_newRooms, key, NewRoomWindow, NewRoomMaxInWindow, NewRoomBlock, out blockedFor);

    /// <summary>
    /// Verifica si una clave está actualmente bloqueada.
    /// 
    /// - Si el bloqueo expiró, se limpia automáticamente
    /// - Devuelve el tiempo restante si sigue bloqueado
    /// </summary>
    private static bool IsBlocked(
        ConcurrentDictionary<string, Counter> dict,
        string key,
        out TimeSpan remaining)
    {
        remaining = TimeSpan.Zero;

        // Si no existe contador, no está bloqueado
        if (!dict.TryGetValue(key, out var c))
            return false;

        // Si no hay bloqueo activo, no está bloqueado
        if (c.BlockedUntilUtc is null)
            return false;

        var now = DateTimeOffset.UtcNow;

        // Si el bloqueo ya expiró, se limpia
        if (c.BlockedUntilUtc.Value <= now)
        {
            c.BlockedUntilUtc = null;
            return false;
        }

        // Aún bloqueado → se calcula tiempo restante
        remaining = c.BlockedUntilUtc.Value - now;
        return true;
    }

    /// <summary>
    /// Registra una acción dentro de una ventana de tiempo.
    /// 
    /// Algoritmo:
    /// 1) Verifica si ya está bloqueado
    /// 2) Reinicia la ventana si ya venció
    /// 3) Incrementa contador
    /// 4) Si supera el máximo → bloquea temporalmente
    /// </summary>
    private static bool TryConsume(
        ConcurrentDictionary<string, Counter> dict,
        string key,
        TimeSpan window,
        int maxInWindow,
        TimeSpan blockDuration,
        out TimeSpan? blockedFor)
    {
        blockedFor = null;

        var now = DateTimeOffset.UtcNow;

        // Obtiene o crea el contador para esta clave
        var c = dict.GetOrAdd(key, _ =>
            new Counter
            {
                WindowStartUtc = now,
                Count = 0
            });

        // Lock por contador para evitar condiciones de carrera
        lock (c)
        {
            // Si está bloqueado actualmente
            if (c.BlockedUntilUtc is not null && c.BlockedUntilUtc.Value > now)
            {
                blockedFor = c.BlockedUntilUtc.Value - now;
                return false;
            }

            // Si la ventana ya venció, se reinicia
            if (now - c.WindowStartUtc >= window)
            {
                c.WindowStartUtc = now;
                c.Count = 0;
            }

            // Se registra la acción
            c.Count++;

            // Si supera el límite → se bloquea
            if (c.Count > maxInWindow)
            {
                c.BlockedUntilUtc = now.Add(blockDuration);
                blockedFor = blockDuration;
                return false;
            }

            // Acción permitida
            return true;
        }
    }
}
