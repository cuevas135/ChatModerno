// ===============================
// config.js - Configuración global
// ===============================

window.CONFIG = {
  // Sala y usuario por defecto si el input está vacío
  defaults: {
    user: "Anónimo",
    room: "general",
  },

  // Historial que pedimos/mostramos al entrar
  history: {
    take: 50, // coincide con el server (GetLast(room, 50))
    showSystemMessage: true,
  },

  // Typing indicator
  typing: {
    timeoutMs: 1200,
    sendDebounceMs: 250, // evita spamear "Typing" demasiado seguido
  },

  // Sonido al recibir mensajes (de otros)
  sound: {
    enabled: true,
    frequencyHz: 660,
    durationMs: 80,
    gain: 0.035,
  },

  // UI
  ui: {
    compactMode: true, // por si luego haces toggle
    scrollOnNewMessage: true,
  },

  // Reconexión a SignalR
  reconnect: {
    retryMs: 1500,
  },

  // Tema
  theme: {
    default: "dark", // "dark" o "light"
    storageKey: "theme",
  },
};
