// ===============================
// ui.js - Render / UI helpers
// Requiere: CONFIG (typing/emoji), utils.js (safe, fmtTime, hashColor, initial)
// ===============================

// -------------------------------
// Cache de elementos del DOM
// -------------------------------
window.UI = {
  logEl: document.getElementById("log"),
  typingEl: document.getElementById("typing"),
  userEl: document.getElementById("user"),
  roomEl: document.getElementById("room"),
  roomLabel: document.getElementById("roomLabel"),
  statusLabel: document.getElementById("statusLabel"),
  msgEl: document.getElementById("message"),
  btnJoin: document.getElementById("join"),
  btnLeave: document.getElementById("leave"),
  btnSend: document.getElementById("send"),
  emojiBtn: document.getElementById("emojiBtn"),
  emojiPanel: document.getElementById("emojiPanel"),
  stickerButtons: document.querySelectorAll(".sticker-btn"),
  buzzBtn: document.getElementById("buzzBtn")
};

// -------------------------------
// Scroll inteligente
// -------------------------------

// ¿El usuario está cerca del final del chat?
function isNearBottom() {
  const el = UI.logEl;
  const threshold = 80; // px desde el final para considerar "está abajo"
  return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
}

// Scroll al final (espera al render del DOM)
window.scrollBottom = function scrollBottom(force = false) {
  if (!UI.logEl) return;

  // Si el usuario NO está abajo, no lo arrastres (a menos que force=true)
  if (!force && !isNearBottom()) return;

  requestAnimationFrame(() => {
    UI.logEl.scrollTop = UI.logEl.scrollHeight;
  });
};

// -------------------------------
// Mensajes del sistema
// -------------------------------
window.addSystem = function addSystem(text) {
  const div = document.createElement("div");
  div.className = "system-msg";
  div.textContent = text;

  UI.logEl.appendChild(div);
  scrollBottom(); // autoscroll inteligente
};

// -------------------------------
// Mensajes de usuario
// -------------------------------
window.addMessage = function addMessage(user, text, atUtc, isMe) {
  const row = document.createElement("div");
  row.className = "msg-row " + (isMe ? "me" : "other");

  // Avatar solo para otros
  if (!isMe) {
    const av = document.createElement("div");
    av.className = "avatar";
    av.style.background = hashColor(user);
    av.textContent = initial(user);
    row.appendChild(av);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble " + (isMe ? "me" : "other");

  // Nombre del usuario (en su línea)
  const userSpan = document.createElement("span");
  userSpan.className = "user";
  userSpan.textContent = user;
  bubble.appendChild(userSpan);

  // Texto del mensaje (escapado)
  const textSpan = document.createElement("span");
  textSpan.innerHTML = safe(text);
  bubble.appendChild(textSpan);

  // Hora
  const meta = document.createElement("div");
  meta.className = "meta";
  const timeSpan = document.createElement("span");
  timeSpan.textContent = atUtc ? fmtTime(atUtc) : "";
  meta.appendChild(timeSpan);
  bubble.appendChild(meta);

  row.appendChild(bubble);
  UI.logEl.appendChild(row);

  scrollBottom(); // autoscroll inteligente
};

// -------------------------------
// Typing indicator
// -------------------------------
let typingTimer = null;

window.showTyping = function showTyping(user) {
  UI.typingEl.textContent = `${user} está escribiendo...`;
  clearTimeout(typingTimer);

  // Si CONFIG no está listo, fallback a 1200ms
  const ms = (window.CONFIG?.typing?.timeoutMs ?? 1200);

  typingTimer = setTimeout(() => {
    UI.typingEl.textContent = "";
  }, ms);
};

// -------------------------------
// Emojis
// -------------------------------

// Renderiza emojis según CONFIG.emoji.categories
window.renderEmojis = function renderEmojis() {
  if (!UI.emojiPanel) return;

  // Si CONFIG aún no existe, salimos sin romper
  const cats = window.CONFIG?.emoji?.categories;
  if (!cats) {
    console.warn("CONFIG.emoji.categories no existe (aún).");
    return;
  }

  UI.emojiPanel.innerHTML = "";

  Object.values(cats).forEach(group => {
    group.forEach(e => {
      const span = document.createElement("span");
      span.textContent = e;
      UI.emojiPanel.appendChild(span);
    });
  });
};

// Renderiza emojis cuando ya cargó todo el DOM + scripts
// (esto evita el caso "no salen los emojis" por orden de carga)
document.addEventListener("DOMContentLoaded", () => {
  renderEmojis();
});
