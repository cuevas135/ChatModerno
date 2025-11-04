using ChatSalaModern.Models;
using System.Collections.Concurrent;

namespace ChatSalaModern.Services;

public class ChatRoomStore
{
    private readonly ConcurrentDictionary<string, List<ChatMessage>> _rooms =
        new(StringComparer.OrdinalIgnoreCase);

    private const int MaxPerRoom = 200;

    public IReadOnlyList<ChatMessage> GetLast(string room, int take = 50)
    {
        var list = _rooms.GetOrAdd(room, _ => new List<ChatMessage>());
        return list.TakeLast(Math.Min(take, list.Count)).ToList();
    }

    public void Add(string room, ChatMessage msg)
    {
        var list = _rooms.GetOrAdd(room, _ => new List<ChatMessage>());
        lock (list)
        {
            list.Add(msg);
            if (list.Count > MaxPerRoom)
                list.RemoveRange(0, list.Count - MaxPerRoom);
        }
    }
}
