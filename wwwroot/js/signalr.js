// ===============================
// signalr.js - Conexión SignalR + eventos
// Requiere: CONFIG, STATE, UI, addMessage, addSystem, showTyping, playPing
// ===============================

// Conexión al hub
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/chat")
  .withAutomaticReconnect()
  .build();


// ===============================
// Handlers desde el servidor (Hub -> Cliente)
// ===============================

connection.on("ReceiveSystem", text => addSystem(text));

connection.on("ReceiveMessage", msg => {
  // Usuario actual según estado (si no, cae a defaults)
  const currentUser = (STATE.user || (UI.userEl.value || "").trim() || CONFIG.defaults.user);
  const isMe = msg.user === currentUser;

  addMessage(msg.user, msg.text, msg.at, isMe);

  // Sonido solo si es de otra persona y está habilitado por config
  if (!isMe) playPing();
});

connection.on("ReceiveHistory", list => {
  if (!list || !list.length) return;

  if (CONFIG.history.showSystemMessage) {
    addSystem(`Cargando ${list.length} mensajes previos...`);
  }

  const currentUser = (STATE.user || (UI.userEl.value || "").trim() || CONFIG.defaults.user);

  list.forEach(m => {
    const isMe = m.user === currentUser;
    addMessage(m.user, m.text, m.at, isMe);
  });
});

connection.on("UserTyping", user => {
  // Muestra typing con el timeout definido en ui.js (usa CONFIG.typing.timeoutMs)
  showTyping(user);
});


// ===============================
// Arranque con reintentos
// ===============================

async function startConnection() {
  try {
    await connection.start();
    STATE.setConnected(true);
  } catch (err) {
    STATE.setConnected(false);
    console.error("Error conectando a SignalR:", err);
    setTimeout(startConnection, CONFIG.reconnect.retryMs);
  }
}

startConnection();


// ===============================
// Eventos UI -> Hub
// ===============================

// JOIN: entrar a una sala
UI.btnJoin.addEventListener("click", async () => {
  // Lee inputs y actualiza STATE.user / STATE.room con defaults
  const { user, room } = STATE.readFromInputs();

  if (!connection || connection.state !== "Connected") return;

  // Invoca JoinRoom en el Hub
  await connection.invoke("JoinRoom", room, user);

  // Marcamos que YA estamos dentro de sala
  STATE.enteredRoom(user, room);

  // UI state
  UI.msgEl.disabled = UI.btnSend.disabled = UI.btnLeave.disabled = false;
  UI.btnJoin.disabled = true;
  UI.userEl.disabled = UI.roomEl.disabled = true;

  UI.roomLabel.textContent = `Sala: ${room}`;
  UI.statusLabel.textContent = `Conectado como "${user}"`;
  UI.msgEl.focus();
});


// LEAVE: salir de la sala actual
UI.btnLeave.addEventListener("click", async () => {
  const { user, room } = STATE.readFromInputs();

  if (!connection || connection.state !== "Connected") return;

  await connection.invoke("LeaveRoom", room, user);

  // Estado interno
  STATE.leftRoom();

  // UI state
  UI.msgEl.disabled = UI.btnSend.disabled = UI.btnLeave.disabled = true;
  UI.btnJoin.disabled = false;
  UI.userEl.disabled = UI.roomEl.disabled = false;

  UI.typingEl.textContent = "";
  UI.roomLabel.textContent = "Ninguna sala";
  UI.statusLabel.textContent = "Conéctate a una sala para empezar";
});


// SEND: enviar mensaje (click)
UI.btnSend.addEventListener("click", async () => {
  const { user, room } = STATE.readFromInputs();
  const text = UI.msgEl.value.trim();

  if (!text) return;
  if (!connection || connection.state !== "Connected") return;

  await connection.invoke("SendMessage", room, user, text);

  UI.msgEl.value = "";
  UI.msgEl.focus();
});


// SEND: Enter para enviar
UI.msgEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && !UI.btnSend.disabled) {
    e.preventDefault();
    UI.btnSend.click();
  }
});


// TYPING: avisar "está escribiendo..." con debounce (anti-spam)
UI.msgEl.addEventListener("input", () => {
  if (!connection || connection.state !== "Connected") return;

  const now = Date.now();
  if (now - STATE.lastTypingSentAt < CONFIG.typing.sendDebounceMs) return;

  const { user, room } = STATE.readFromInputs();
  STATE.lastTypingSentAt = now;

  connection.invoke("Typing", room, user).catch(() => {});
});


// ===============================
// Emojis
// ===============================

UI.emojiBtn.addEventListener("click", () => {
  const visible = UI.emojiPanel.style.display === "block";
  UI.emojiPanel.style.display = visible ? "none" : "block";
});

UI.emojiPanel.addEventListener("click", e => {
  if (e.target.tagName === "SPAN") {
    UI.msgEl.value += e.target.textContent;
    UI.msgEl.focus();
  }
});

document.addEventListener("click", e => {
  if (!UI.emojiPanel.contains(e.target) && e.target !== UI.emojiBtn) {
    UI.emojiPanel.style.display = "none";
  }
});


// ===============================
// Stickers
// ===============================

UI.stickerButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const icon = btn.getAttribute("data-sticker") || "";
    if (!icon) return;

    const { user, room } = STATE.readFromInputs();

    if (!connection || connection.state !== "Connected") return;

    await connection.invoke("SendMessage", room, user, icon);
  });
});
