namespace ChatSalaModern.Models;

/// <summary>
/// Representa un mensaje del chat.
/// - User: nombre del usuario que envía
/// - Text: contenido del mensaje
/// - At: fecha/hora (idealmente en UTC) del mensaje
/// 
/// Es un "record": tipo inmutable orientado a datos, útil para transporte y serialización.
/// </summary>
public record ChatMessage(string User, string Text, DateTimeOffset At);

