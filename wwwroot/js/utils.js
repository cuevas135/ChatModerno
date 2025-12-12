// ===============================
// utils.js - Helpers generales
// ===============================

// Escapa HTML para evitar XSS
window.safe = function safe(s) {
  return (s ?? "").toString().replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
};

// Formatea hora local desde ISO
window.fmtTime = function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString(); }
  catch { return ""; }
};

// Color estable por nombre (HSL)
window.hashColor = function hashColor(name) {
  let h = 0;
  const s = (name || "").trim();
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 45%)`;
};

// Inicial del nombre
window.initial = function initial(name) {
  const t = (name || "").trim();
  return t ? t[0].toUpperCase() : "?";
};

// Sonido suave al recibir (sin archivos externos)
let audioCtx = null;
window.playPing = function playPing() {
  if (!CONFIG.sound.enabled) return;

  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.type = "sine";
    o.frequency.value = CONFIG.sound.frequencyHz;
    g.gain.value = CONFIG.sound.gain;

    o.connect(g); g.connect(audioCtx.destination);

    o.start();
    setTimeout(() => o.stop(), CONFIG.sound.durationMs);
  } catch {}
};

