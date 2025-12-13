using ChatSalaModern.Models;
using System.Collections.Concurrent;

namespace ChatSalaModern.Services;

/// <summary>
/// Almacén en memoria de mensajes por sala.
/// - Mantiene historial limitado por sala
/// - Es thread-safe a nivel de diccionario
/// - Usa locking fino por sala (lista) para escrituras
/// </summary>
public class ChatRoomStore
{
    // Diccionario concurrente:
    // Key   → nombre de la sala
    // Value → lista de mensajes de esa sala
    // Usa StringComparer.OrdinalIgnoreCase para evitar duplicar salas por mayúsculas
    private readonly ConcurrentDictionary<string, List<ChatMessage>> _rooms =
        new(StringComparer.OrdinalIgnoreCase);

    // Máximo de mensajes almacenados por sala
    // Evita crecimiento infinito de memoria
    private const int MaxPerRoom = 100;

    /// <summary>
    /// Obtiene los últimos mensajes de una sala.
    /// - Si la sala no existe, la crea vacía
    /// - Retorna como máximo "take" mensajes
    /// - Nunca retorna más mensajes de los que existen
    /// </summary>
    /// <param name="room">Nombre de la sala</param>
    /// <param name="take">Cantidad máxima a devolver (default 50)</param>
    /// <returns>Lista de mensajes recientes</returns>
    public IReadOnlyList<ChatMessage> GetLast(string room, int take = 50)
    {
        // Obtiene la lista de la sala o la crea si no existe
        var list = _rooms.GetOrAdd(room, _ => new List<ChatMessage>());

        // Devuelve solo los últimos "take" mensajes
        // TakeLast protege contra desbordes
        return list
            .TakeLast(Math.Min(take, list.Count))
            .ToList();
    }

    /// <summary>
    /// Agrega un mensaje a una sala.
    /// - Protege la lista con lock para evitar race conditions
    /// - Aplica política de recorte si se supera el máximo permitido
    /// </summary>
    /// <param name="room">Nombre de la sala</param>
    /// <param name="msg">Mensaje a agregar</param>
    public void Add(string room, ChatMessage msg)
    {
        // Obtiene la lista de la sala o la crea
        var list = _rooms.GetOrAdd(room, _ => new List<ChatMessage>());

        // Lock a nivel de lista (no a nivel global)
        // Permite concurrencia entre salas distintas
        lock (list)
        {
            // Agrega el mensaje
            list.Add(msg);

            // Si se supera el máximo, se eliminan los más antiguos
            if (list.Count > MaxPerRoom)
            {
                list.RemoveRange(0, list.Count - MaxPerRoom);
            }
        }
    }
}
