// ===============================
// utils.js - Helpers generales
// ===============================

// -------------------------------
// Seguridad
// -------------------------------

// Escapa caracteres HTML peligrosos para evitar XSS
// Convierte <, > y & en entidades HTML seguras
window.safe = function safe(s) {
  return (s ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};


// -------------------------------
// Formato de fecha y hora
// -------------------------------

// Formatea una fecha ISO a hora local del navegador
// Ejemplo: "2025-01-01T18:30:00Z" → "13:30:00"
window.fmtTime = function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    // Si el formato es inválido, retorna vacío
    return "";
  }
};

// -------------------------------
// Utilidades visuales
// -------------------------------

// Genera un color estable (HSL) a partir de un nombre
// El mismo nombre siempre producirá el mismo color
window.hashColor = function hashColor(name) {
  let h = 0;

  // Normaliza el texto
  const s = (name || "").trim();

  // Algoritmo simple de hash basado en charCode
  for (let i = 0; i < s.length; i++) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }

  // Se limita el valor al rango de colores (0–359)
  const hue = Math.abs(h) % 360;

  // Retorna color HSL balanceado para UI
  return `hsl(${hue} 70% 45%)`;
};

// -------------------------------
// Texto y avatar
// -------------------------------

// Obtiene la inicial del nombre del usuario
// Si no hay nombre, retorna "?"
window.initial = function initial(name) {
  const t = (name || "").trim();
  return t ? t[0].toUpperCase() : "?";
};

// -------------------------------
// Sonido: Ping (mensaje recibido)
// -------------------------------

// AudioContext reutilizable para evitar múltiples instancias
let audioCtx = null;

// Reproduce un sonido suave al recibir mensajes
// No utiliza archivos externos (Web Audio API)
window.playPing = function playPing() {
  // Verifica si el sonido está habilitado
  if (!CONFIG?.sound?.enabled) return;

  try {
    // Crea o reutiliza el AudioContext
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    // Configuración del sonido
    o.type = "sine";
    o.frequency.value = CONFIG.sound.frequencyHz;
    g.gain.value = CONFIG.sound.gain;

    // Conexión del flujo de audio
    o.connect(g);
    g.connect(audioCtx.destination);

    // Reproduce el sonido
    o.start();

    // Detiene el sonido tras la duración configurada
    setTimeout(() => o.stop(), CONFIG.sound.durationMs);

  } catch {
    // Algunos navegadores pueden bloquear audio automático
  }
};

// -------------------------------
// Buzz: efecto visual
// -------------------------------

// Aplica una sacudida visual al contenedor del chat
window.triggerBuzzUI = function triggerBuzzUI() {
  // Verifica si el efecto visual está habilitado
  if (!CONFIG.buzz?.visualShake) return;

  // Contenedor principal del chat
  const chatEl = document.querySelector(".chat");
  if (!chatEl) return;

  // Reinicia la animación eliminando y reinsertando la clase
  chatEl.classList.remove("buzz");
  void chatEl.offsetWidth; // fuerza reflow
  chatEl.classList.add("buzz");

  // Limpia la clase luego de la duración del buzz
  setTimeout(
    () => chatEl.classList.remove("buzz"),
    CONFIG.buzz.durationMs
  );
};

// -------------------------------
// Buzz: sonido
// -------------------------------

// Reproduce el sonido del buzz (zumbido)
// Usa variaciones de frecuencia para mayor impacto
window.playBuzz = function playBuzz() {
  // Verifica si el buzz está habilitado
  if (!CONFIG.buzz?.enabled) return;

  try {
    // Reutiliza el AudioContext existente
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    // Tipo square para sonido más agresivo
    o.type = "square";
    g.gain.value = CONFIG.buzz.gain;

    o.connect(g);
    g.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    const total = CONFIG.buzz.durationMs / 1000;
    const shakes = CONFIG.buzz.shakes;

    // Alterna frecuencias para simular vibración
    for (let i = 0; i < shakes; i++) {
      const t = now + (i * total) / shakes;
      const f = CONFIG.buzz.baseFreqHz + (i % 2 === 0 ? 30 : -30);
      o.frequency.setValueAtTime(f, t);
    }

    // Reproduce el buzz
    o.start(now);
    o.stop(now + total);

  } catch {
    // Si el navegador bloquea audio, se ignora silenciosamente
  }
};
