using Microsoft.AspNetCore.SignalR;
using ChatSalaModern.Models;
using ChatSalaModern.Services;

namespace ChatSalaModern.Hubs;

/// <summary>
/// Hub principal del chat en tiempo real (SignalR).
/// 
/// Responsabilidades:
/// - Manejar ingreso y salida de salas (Groups)
/// - Enviar y recibir mensajes
/// - Controlar evento "typing"
/// - Aplicar reglas anti-spam (buzz y creación de salas)
/// - Enviar historial al usuario que entra
/// </summary>
public class ChatHub : Hub
{
    // Store en memoria PRO:
    // - Guarda mensajes por sala
    // - Aplica TTL y limpieza automática
    private readonly ChatRoomStorePro _store;

    // Guard de abuso:
    // - Bloqueo temporal por spam de buzz
    // - Bloqueo temporal por crear demasiadas salas
    private readonly ChatAbuseGuard _guard;

    /// <summary>
    /// Constructor del Hub.
    /// SignalR inyecta las dependencias automáticamente (DI).
    /// </summary>
    public ChatHub(ChatRoomStorePro store, ChatAbuseGuard guard)
    {
        _store = store;
        _guard = guard;
    }

    /// <summary>
    /// Se ejecuta automáticamente cuando un cliente se conecta al Hub.
    /// 
    /// Punto ideal para:
    /// - logging
    /// - métricas
    /// - asociar ConnectionId a un usuario autenticado
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Une a un usuario a una sala (SignalR Group).
    /// 
    /// Flujo:
    /// 1) Validación básica
    /// 2) Control anti-spam si la sala es nueva
    /// 3) Agregar conexión al grupo
    /// 4) Enviar historial SOLO al usuario que entra
    /// 5) Notificar a la sala con mensaje de sistema
    /// </summary>
    public async Task JoinRoom(string room, string user)
    {
        // Validación básica
        if (string.IsNullOrWhiteSpace(room) || string.IsNullOrWhiteSpace(user))
            return;

        // Clave para control de abuso
        // Se usa ConnectionId + user para evitar evasión simple
        var key = $"{Context.ConnectionId}:{user}".ToLowerInvariant();

        // Determina si la sala aún no existe (sala nueva)
        var isNewRoom = !_store.RoomExists(room);

        // -------------------------------
        // Anti-spam: creación de salas
        // -------------------------------
        if (isNewRoom)
        {
            // Si ya está bloqueado, se informa al usuario
            if (_guard.IsNewRoomBlocked(key, out var remaining))
            {
                await Clients.Caller.SendAsync(
                    "ReceiveSystem",
                    $"🚫 Estás bloqueado por crear muchas salas. Intenta en {Math.Ceiling(remaining.TotalSeconds)}s."
                );
                return;
            }

            // Consume un intento de creación de sala
            // Si excede el límite, se bloquea temporalmente
            if (!_guard.TryConsumeNewRoom(key, out var blockedFor))
            {
                await Clients.Caller.SendAsync(
                    "ReceiveSystem",
                    $"🚫 Demasiadas salas nuevas. Bloqueado por {Math.Ceiling(blockedFor!.Value.TotalSeconds)}s."
                );
                return;
            }
        }

        // -------------------------------
        // Ingreso a la sala
        // -------------------------------

        // Agrega la conexión actual al grupo de SignalR
        await Groups.AddToGroupAsync(Context.ConnectionId, room);

        // Envía el historial SOLO al usuario que entra
        await Clients.Caller.SendAsync("ReceiveHistory", _store.GetLast(room, 50));

        // Notifica a todos en la sala
        await Clients.Group(room).SendAsync(
            "ReceiveSystem",
            $"{user} se unió a {room}"
        );
    }

    /// <summary>
    /// Saca al usuario de una sala.
    /// 
    /// Flujo:
    /// 1) Remueve la conexión del grupo
    /// 2) Notifica a los demás con mensaje de sistema
    /// </summary>
    public async Task LeaveRoom(string room, string user)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);

        await Clients.Group(room).SendAsync(
            "ReceiveSystem",
            $"{user} salió de {room}"
        );
    }

    /// <summary>
    /// Envía un mensaje a la sala.
    /// 
    /// Flujo:
    /// 1) Validación básica
    /// 2) Control anti-spam si el mensaje es BUZZ
    /// 3) Guardar mensaje en el store
    /// 4) Emitir mensaje a todos los miembros de la sala
    /// </summary>
    public async Task SendMessage(string room, string user, string text)
    {
        // Validación básica
        if (string.IsNullOrWhiteSpace(room) ||
            string.IsNullOrWhiteSpace(user) ||
            string.IsNullOrWhiteSpace(text))
            return;

        // -------------------------------
        // Anti-spam: BUZZ
        // -------------------------------
        // El buzz se identifica por una clave especial enviada desde el front
        if (text.Trim() == "__BUZZ__")
        {
            var key = $"{Context.ConnectionId}:{user}".ToLowerInvariant();

            // Si está bloqueado, se informa
            if (_guard.IsBuzzBlocked(key, out var remaining))
            {
                await Clients.Caller.SendAsync(
                    "ReceiveSystem",
                    $"🚫 Estás bloqueado por spam de zumbidos. Intenta en {Math.Ceiling(remaining.TotalSeconds)}s."
                );
                return;
            }

            // Consume un intento de buzz
            // Si excede el límite, se bloquea
            if (!_guard.TryConsumeBuzz(key, out var blockedFor))
            {
                await Clients.Caller.SendAsync(
                    "ReceiveSystem",
                    $"🚫 Demasiados zumbidos. Bloqueado por {Math.Ceiling(blockedFor!.Value.TotalSeconds)}s."
                );
                return;
            }
        }

        // -------------------------------
        // Mensaje normal
        // -------------------------------

        // Crea el mensaje con timestamp UTC
        var msg = new ChatMessage(user, text, DateTimeOffset.UtcNow);

        // Guarda en el store
        _store.Add(room, msg);

        // Envía a todos los usuarios de la sala
        await Clients.Group(room).SendAsync("ReceiveMessage", msg);
    }

    /// <summary>
    /// Evento "Typing".
    /// 
    /// Envía a todos los usuarios del grupo
    /// EXCEPTO al emisor.
    /// </summary>
    public Task Typing(string room, string user) =>
        Clients.OthersInGroup(room).SendAsync("UserTyping", user);

    /// <summary>
    /// Cambia al usuario de una sala a otra.
    /// 
    /// Flujo:
    /// 1) Sale de la sala actual (si existe)
    /// 2) Entra a la nueva sala
    /// 3) Envía historial de la nueva sala
    /// 4) Notifica a la sala destino
    /// </summary>
    public async Task SwitchRoom(string from, string to, string user)
    {
        // Si viene de una sala previa, sale
        if (!string.IsNullOrWhiteSpace(from))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, from);

        // Entra a la nueva sala
        await Groups.AddToGroupAsync(Context.ConnectionId, to);

        // Envía historial SOLO al usuario que cambia
        await Clients.Caller.SendAsync("ReceiveHistory", _store.GetLast(to, 50));

        // Notifica a los demás usuarios de la sala
        await Clients.Group(to).SendAsync(
            "ReceiveSystem",
            $"{user} se unió a {to}"
        );
    }
}
