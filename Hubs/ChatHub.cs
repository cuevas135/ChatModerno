using Microsoft.AspNetCore.SignalR;
using ChatSalaModern.Models;
using ChatSalaModern.Services;

namespace ChatSalaModern.Hubs;

/// <summary>
/// Hub principal del chat.
/// Maneja: entrar/salir de sala, enviar mensajes, typing y cambio de sala.
/// </summary>
public class ChatHub : Hub
{
    // Store en memoria (o servicio) que guarda historial por sala
    private readonly ChatRoomStore _store;

    // Inyección del store por DI
    public ChatHub(ChatRoomStore store) => _store = store;

    /// <summary>
    /// Se ejecuta cuando un cliente se conecta al Hub.
    /// Por ahora no hace nada extra, pero queda como punto de extensión:
    /// - logs
    /// - tracking de conexiones
    /// - asignar usuario/claims
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Une al usuario a una sala (SignalR Group).
    /// 1) Agrega la conexión al grupo (sala)
    /// 2) Envía al caller el historial de la sala
    /// 3) Notifica al grupo un mensaje de sistema
    /// </summary>
    public async Task JoinRoom(string room, string user)
    {
        // Agrega la conexión actual al grupo "room"
        await Groups.AddToGroupAsync(Context.ConnectionId, room);

        // Enviar historial SOLO al usuario que entra
        // Nota: aquí pides 50, coincide con el front y config (GetLast(room, 50))
        await Clients.Caller.SendAsync("ReceiveHistory", _store.GetLast(room, 50));

        // Notificar a toda la sala que este usuario se unió
        await Clients.Group(room).SendAsync("ReceiveSystem", $"{user} se unió a {room}");
    }

    /// <summary>
    /// Saca al usuario de la sala:
    /// 1) Remueve la conexión del grupo
    /// 2) Notifica a la sala con mensaje de sistema
    /// </summary>
    public async Task LeaveRoom(string room, string user)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);
        await Clients.Group(room).SendAsync("ReceiveSystem", $"{user} salió de {room}");
    }

    /// <summary>
    /// Envía un mensaje a la sala:
    /// 1) Crea un ChatMessage con timestamp UTC
    /// 2) Lo guarda en el store por sala
    /// 3) Lo transmite a todos los miembros del grupo (incluye al que envía)
    /// </summary>
    public async Task SendMessage(string room, string user, string text)
    {
        var msg = new ChatMessage(user, text, DateTimeOffset.UtcNow);

        // Guardar en historial (por sala)
        _store.Add(room, msg);

        // Enviar a todos los de la sala
        await Clients.Group(room).SendAsync("ReceiveMessage", msg);
    }

    /// <summary>
    /// Evento de "Typing":
    /// envía a todos menos al emisor dentro del mismo grupo.
    /// (El front lo usa para mostrar "X está escribiendo...")
    /// </summary>
    public Task Typing(string room, string user) =>
        Clients.OthersInGroup(room).SendAsync("UserTyping", user);

    /// <summary>
    /// Cambia de sala:
    /// 1) Si "from" existe, sale de esa sala
    /// 2) Entra a la sala "to"
    /// 3) Envía historial al caller
    /// 4) Notifica al grupo destino con mensaje de sistema
    /// </summary>
    public async Task SwitchRoom(string from, string to, string user)
    {
        // Si viene de una sala anterior, la abandona
        if (!string.IsNullOrWhiteSpace(from))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, from);

        // Entra a la nueva sala
        await Groups.AddToGroupAsync(Context.ConnectionId, to);

        // Envía el historial de la sala destino al usuario que cambia
        await Clients.Caller.SendAsync("ReceiveHistory", _store.GetLast(to, 50));

        // Notifica a la sala destino que se unió
        await Clients.Group(to).SendAsync("ReceiveSystem", $"{user} se unió a {to}");
    }
}
