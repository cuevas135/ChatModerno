using System.Collections.Concurrent;
using ChatSalaModern.Models;

namespace ChatSalaModern.Services;

public sealed class ChatRoomStorePro
{
    private sealed class RoomBucket
    {
        public List<ChatMessage> Messages { get; } = [];
        public DateTimeOffset LastActivityUtc { get; set; } = DateTimeOffset.UtcNow;
    }

    private readonly ConcurrentDictionary<string, RoomBucket> _rooms =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly int _maxPerRoom;
    private readonly TimeSpan _roomTtl;

    public ChatRoomStorePro(int maxPerRoom = 100, TimeSpan? roomTtl = null)
    {
        _maxPerRoom = Math.Max(10, maxPerRoom);
        _roomTtl = roomTtl ?? TimeSpan.FromHours(12); // default: 12h sin actividad => se borra
    }

    public IReadOnlyList<ChatMessage> GetLast(string room, int take = 50)
    {
        if (string.IsNullOrWhiteSpace(room)) return Array.Empty<ChatMessage>();

        var bucket = _rooms.GetOrAdd(room, _ => new RoomBucket());

        lock (bucket.Messages)
        {
            bucket.LastActivityUtc = DateTimeOffset.UtcNow;

            if (bucket.Messages.Count == 0) return Array.Empty<ChatMessage>();
            return bucket.Messages.TakeLast(Math.Min(take, bucket.Messages.Count)).ToList();
        }
    }

    public void Add(string room, ChatMessage msg)
    {
        if (string.IsNullOrWhiteSpace(room)) return;

        var bucket = _rooms.GetOrAdd(room, _ => new RoomBucket());

        lock (bucket.Messages)
        {
            bucket.LastActivityUtc = DateTimeOffset.UtcNow;

            bucket.Messages.Add(msg);

            var overflow = bucket.Messages.Count - _maxPerRoom;
            if (overflow > 0)
                bucket.Messages.RemoveRange(0, overflow);
        }
    }

    /// <summary>
    /// Limpia salas que no han tenido actividad por más del TTL configurado.
    /// </summary>
    public int CleanupInactiveRooms()
    {
        var now = DateTimeOffset.UtcNow;
        var removed = 0;

        foreach (var kv in _rooms)
        {
            var room = kv.Key;
            var bucket = kv.Value;

            // Lectura rápida; si se actualiza justo ahora, no pasa nada grave:
            // en el peor caso, no se borra o se borra y se recrea al siguiente mensaje.
            if (now - bucket.LastActivityUtc > _roomTtl)
            {
                if (_rooms.TryRemove(room, out _))
                    removed++;
            }
        }

        return removed;
    }

    public bool RoomExists(string room)
{
    if (string.IsNullOrWhiteSpace(room)) return false;
    return _rooms.ContainsKey(room);
}

}
