using Microsoft.AspNetCore.SignalR;
using ChatSalaModern.Models;
using ChatSalaModern.Services;

namespace ChatSalaModern.Hubs;

public class ChatHub : Hub
{
    private readonly ChatRoomStore _store;
    public ChatHub(ChatRoomStore store) => _store = store;

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(string room, string user)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, room);
        await Clients.Caller.SendAsync("ReceiveHistory", _store.GetLast(room, 50));
        await Clients.Group(room).SendAsync("ReceiveSystem", $"{user} se unió a {room}");
    }

    public async Task LeaveRoom(string room, string user)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);
        await Clients.Group(room).SendAsync("ReceiveSystem", $"{user} salió de {room}");
    }

    public async Task SendMessage(string room, string user, string text)
    {
        var msg = new ChatMessage(user, text, DateTimeOffset.UtcNow);
        _store.Add(room, msg);
        await Clients.Group(room).SendAsync("ReceiveMessage", msg);
    }

    public Task Typing(string room, string user) =>
        Clients.OthersInGroup(room).SendAsync("UserTyping", user);

    public async Task SwitchRoom(string from, string to, string user)
    {
        if (!string.IsNullOrWhiteSpace(from))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, from);

        await Groups.AddToGroupAsync(Context.ConnectionId, to);
        await Clients.Caller.SendAsync("ReceiveHistory", _store.GetLast(to, 50));
        await Clients.Group(to).SendAsync("ReceiveSystem", $"{user} se unió a {to}");
    }
}
