namespace ChatSalaModern.Models;

public record ChatMessage(string User, string Text, DateTimeOffset At);
