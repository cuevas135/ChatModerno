// ===============================
// config.js - Configuración global
// ===============================

// Objeto global de configuración accesible desde cualquier script
window.CONFIG = {

  // -------------------------------
  // Valores por defecto
  // -------------------------------
  defaults: {
    // Nombre de usuario si el input está vacío
    user: "Anónimo",

    // Sala por defecto al ingresar
    room: "general",
  },

  // -------------------------------
  // Configuración del historial
  // -------------------------------
  history: {
    // Cantidad de mensajes que se cargan al entrar a una sala
    // Debe coincidir con el backend: GetLast(room, 50)
    take: 50,

    // Indica si se muestran mensajes del sistema
    // (ej: "usuario se unió", "usuario salió")
    showSystemMessage: true,
  },

  // -------------------------------
  // Indicador de "escribiendo..."
  // -------------------------------
  typing: {
    // Tiempo máximo (ms) que se mantiene visible el estado "typing"
    timeoutMs: 1200,

    // Tiempo mínimo entre envíos de eventos "Typing"
    // Evita enviar demasiados eventos al servidor
    sendDebounceMs: 250,
  },

  // -------------------------------
  // Sonido al recibir mensajes
  // -------------------------------
  sound: {
    // Activa o desactiva el sonido
    enabled: true,

    // Frecuencia del beep (Hz)
    frequencyHz: 660,

    // Duración del sonido (ms)
    durationMs: 80,

    // Volumen del sonido (0.0 a 1.0)
    gain: 0.035,
  },

  // -------------------------------
  // Configuración de la interfaz (UI)
  // -------------------------------
  ui: {
    // Modo compacto (útil para pantallas pequeñas)
    compactMode: true,

    // Hace scroll automático al llegar un nuevo mensaje
    scrollOnNewMessage: true,
  },

  // -------------------------------
  // Reconexión automática (SignalR)
  // -------------------------------
  reconnect: {
    // Tiempo entre intentos de reconexión (ms)
    retryMs: 1500,
  },

  // -------------------------------
  // Configuración de tema
  // -------------------------------
  theme: {
    // Tema por defecto
    // Valores esperados: "dark" o "light"
    default: "dark",

    // Clave usada en localStorage para guardar el tema
    storageKey: "theme",
  },

  // -------------------------------
  // Configuración del "Buzz"
  // (efecto especial tipo zumbido/alerta)
  // -------------------------------
  buzz: {
    // Activa o desactiva la funcionalidad
    enabled: true,

    // Tiempo mínimo entre buzz (ms)
    // Evita spam del efecto
    cooldownMs: 8000,

    // Clave interna para identificar el buzz
    // No depende de emojis ni texto visible
    key: "__BUZZ__",

    // Duración del sonido del buzz (ms)
    durationMs: 420,

    // Frecuencia base del sonido
    baseFreqHz: 140,

    // Volumen del buzz
    gain: 0.08,

    // Cantidad de vibraciones / sacudidas
    shakes: 12,

    // Activa el efecto visual de sacudida en pantalla
    visualShake: true
  },

  // -------------------------------
  // Configuración de emojis
  // -------------------------------
  emoji: {
    categories: {
      // Emojis de caras / emociones
      caras: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 😘 😗 😙 😚 🤗 🤩 🤔 🤨 😎 🤓 🥳 😴 🤯 😭 😡 😱"
        .split(" "),

      // Emojis de manos y gestos
      manos: "👍 👎 👏 🙌 🤝 🤞 ✌️ 🤙 👌 ✋"
        .split(" "),

      // Emojis de corazones
      corazones: "❤️ 💙 💚 💛 💜 🖤 🤍 🤎 💔 💕 💞 💓"
        .split(" "),

      // Emojis extra / decorativos
      extras: "🔥 ✨ 🌟 💯 🎉 🎊 🚀 👀"
        .split(" ")
    }
  }

};
