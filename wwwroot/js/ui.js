// ===============================
// ui.js - Render / UI helpers
// ===============================

// -------------------------------
// Cache de elementos del DOM
// -------------------------------
// Se guardan referencias para evitar múltiples document.getElementById
// y mejorar rendimiento y legibilidad
window.UI = {
  logEl: document.getElementById("log"),           // Contenedor del chat
  typingEl: document.getElementById("typing"),    // Indicador de "escribiendo..."
  userEl: document.getElementById("user"),         // Input de usuario
  roomEl: document.getElementById("room"),         // Input de sala
  roomLabel: document.getElementById("roomLabel"), // Label de sala actual
  statusLabel: document.getElementById("statusLabel"), // Estado conexión
  msgEl: document.getElementById("message"),       // Input del mensaje
  btnJoin: document.getElementById("join"),        // Botón unirse
  btnLeave: document.getElementById("leave"),      // Botón salir
  btnSend: document.getElementById("send"),        // Botón enviar
  emojiBtn: document.getElementById("emojiBtn"),   // Botón emojis
  emojiPanel: document.getElementById("emojiPanel"), // Panel de emojis
  stickerButtons: document.querySelectorAll(".sticker-btn"), // Stickers
  buzzBtn: document.getElementById("buzzBtn"),     // Botón buzz
};

// -------------------------------
// Scroll automático
// -------------------------------

// Hace scroll al final del log de mensajes
window.scrollBottom = function scrollBottom() {
  UI.logEl.scrollTop = UI.logEl.scrollHeight;
};

// -------------------------------
// Mensajes del sistema
// -------------------------------

// Agrega un mensaje del sistema al chat
// (ej: usuario entra/sale de la sala)
window.addSystem = function addSystem(text) {
  const div = document.createElement("div");
  div.className = "system-msg";
  div.textContent = text;

  UI.logEl.appendChild(div);
  scrollBottom();
};

// -------------------------------
// Mensajes de usuario
// -------------------------------

// Renderiza un mensaje en el chat
// user   → nombre del usuario
// text   → contenido del mensaje
// atUtc  → fecha/hora (ISO)
// isMe   → indica si el mensaje es propio
window.addMessage = function addMessage(user, text, atUtc, isMe) {
  // Fila principal del mensaje
  const row = document.createElement("div");
  row.className = "msg-row " + (isMe ? "me" : "other");

  // Avatar solo para mensajes de otros usuarios
  if (!isMe) {
    const av = document.createElement("div");
    av.className = "avatar";
    av.style.background = hashColor(user); // color estable
    av.textContent = initial(user);        // inicial del nombre
    row.appendChild(av);
  }

  // Burbuja del mensaje
  const bubble = document.createElement("div");
  bubble.className = "bubble " + (isMe ? "me" : "other");

  // Nombre del usuario
  const userSpan = document.createElement("span");
  userSpan.className = "user";
  userSpan.textContent = user;
  bubble.appendChild(userSpan);

  // Texto del mensaje (escapado contra XSS)
  const textSpan = document.createElement("span");
  textSpan.innerHTML = safe(text);
  bubble.appendChild(textSpan);

  // Metadata (hora)
  const meta = document.createElement("div");
  meta.className = "meta";

  const timeSpan = document.createElement("span");
  timeSpan.textContent = atUtc ? fmtTime(atUtc) : "";
  meta.appendChild(timeSpan);

  bubble.appendChild(meta);
  row.appendChild(bubble);

  // Inserta el mensaje en el log
  UI.logEl.appendChild(row);
  scrollBottom();
};

// -------------------------------
// Typing indicator
// -------------------------------

// Timer para ocultar el indicador luego de un tiempo
let typingTimer = null;

// Muestra el texto "X está escribiendo..."
// y lo oculta automáticamente tras el timeout configurado
window.showTyping = function showTyping(user) {
  UI.typingEl.textContent = `${user} está escribiendo...`;

  // Reinicia el temporizador
  clearTimeout(typingTimer);

  typingTimer = setTimeout(
    () => (UI.typingEl.textContent = ""),
    CONFIG.typing.timeoutMs
  );
};

// -------------------------------
// Emojis
// -------------------------------

// Renderiza los emojis según la configuración global
window.renderEmojis = function renderEmojis() {
  const panel = UI.emojiPanel;
  panel.innerHTML = "";

  const cats = CONFIG?.emoji?.categories;
  if (!cats) {
    console.warn("CONFIG.emoji.categories no existe");
    return;
  }

  // Recorre cada categoría y emoji
  Object.values(cats).forEach(group => {
    group.forEach(e => {
      const span = document.createElement("span");
      span.textContent = e;
      panel.appendChild(span);
    });
  });
};

// Renderiza emojis al cargar la UI
renderEmojis();
