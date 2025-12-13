// ===============================
// signalr.js - Conexión SignalR + eventos
// Requiere: CONFIG, STATE, UI, addMessage, addSystem, showTyping, playPing
// ===============================

// -------------------------------
// Conexión al Hub de SignalR
// -------------------------------
// Crea la conexión al endpoint "/chat" y habilita reconexión automática
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/chat")
  .withAutomaticReconnect()
  .build();

// ===============================
// Handlers desde el servidor (Hub -> Cliente)
// ===============================

// Mensajes del sistema (ej: "X entró", "Y salió")
connection.on("ReceiveSystem", text => addSystem(text));

// Mensajes normales (usuario -> sala)
connection.on("ReceiveMessage", msg => {
  // Determina quién es el usuario actual:
  // 1) STATE.user (si ya está seteado)
  // 2) input de UI (si existe)
  // 3) default de CONFIG
  const currentUser =
    STATE.user ||
    (UI.userEl.value || "").trim() ||
    CONFIG.defaults.user;

  // Se considera "mi mensaje" si coincide el usuario
  const isMe = msg.user === currentUser;

  // -------------------------------
  // Caso especial: Buzz/Zumbido
  // -------------------------------
  // Si el texto recibido es la "clave" del buzz, no se muestra como mensaje normal
  if ((msg.text || "").trim() === CONFIG.buzz.key) {
    // Opcional: mostrar como mensaje del sistema
    addSystem(`🔔 Zumbido de ${msg.user}`);

    // Efectos del buzz
    playBuzz?.();
    triggerBuzzUI?.();
    return; // termina aquí para no renderizar burbuja normal
  }

  // -------------------------------
  // Mensaje normal
  // -------------------------------
  addMessage(msg.user, msg.text, msg.at, isMe);

  // Sonido solo cuando el mensaje viene de otra persona
  if (!isMe) playPing?.();
});

// Historial: lista de mensajes previos al entrar a sala
connection.on("ReceiveHistory", list => {
  if (!list || !list.length) return;

  // Mensaje informativo al cargar historial (opcional)
  if (CONFIG.history.showSystemMessage) {
    addSystem(`Cargando ${list.length} mensajes previos...`);
  }

  // Calcula el usuario actual para marcar "isMe" correctamente
  const currentUser =
    (STATE.user || (UI.userEl.value || "").trim() || CONFIG.defaults.user);

  // Renderiza cada mensaje del historial
  list.forEach(m => {
    const isMe = m.user === currentUser;
    
    // ✅ Si es zumbido, muéstralo como sistema y NO como burbuja "__BUZZ__"
    if ((m.text || "").trim() === CONFIG.buzz.key) {
      addSystem(`🔔 Zumbido de ${m.user}`);
      // Opcional: NO reproducir audio ni shake en historial
      // Si lo quieres también en historial, descomenta:
      // playBuzz?.();
      // triggerBuzzUI?.();
      return;
    }

    addMessage(m.user, m.text, m.at, isMe);
  });
});

// Evento typing: otro usuario está escribiendo
connection.on("UserTyping", user => {
  // Muestra typing con timeout (ver ui.js)
  showTyping(user);
});

// ===============================
// Arranque con reintentos
// ===============================

// Inicia la conexión a SignalR
// Si falla, reintenta usando CONFIG.reconnect.retryMs
async function startConnection() {
  try {
    await connection.start();
    STATE.setConnected(true);
  } catch (err) {
    STATE.setConnected(false);
    console.error("Error conectando a SignalR:", err);

    // Reintenta conexión tras cierto tiempo
    setTimeout(startConnection, CONFIG.reconnect.retryMs);
  }
}

// Inicia conexión al cargar el script
startConnection();

// ===============================
// Eventos UI -> Hub
// ===============================

// -------------------------------
// JOIN: entrar a una sala
// -------------------------------
UI.btnJoin?.addEventListener("click", async () => {
  // Lee inputs y aplica defaults (actualiza STATE.user/STATE.room)
  const { user, room } = STATE.readFromInputs();

  // No intentar invocar si no está conectado
  if (!connection || connection.state !== "Connected") return;

  // Llama al método JoinRoom en el Hub
  await connection.invoke("JoinRoom", room, user);

  // Marca estado interno de "está en sala"
  STATE.enteredRoom(user, room);

  // Actualiza el estado de la UI para modo "en sala"
  UI.msgEl.disabled = UI.btnSend.disabled = UI.btnLeave.disabled = false;
  UI.btnJoin.disabled = true;
  UI.userEl.disabled = UI.roomEl.disabled = true;

  // Labels informativos
  UI.roomLabel.textContent = `Sala: ${room}`;
  UI.statusLabel.textContent = `Conectado como "${user}"`;

  // Focus al input de mensaje
  UI.msgEl.focus();
});

// -------------------------------
// LEAVE: salir de la sala actual
// -------------------------------
UI.btnLeave?.addEventListener("click", async () => {
  const { user, room } = STATE.readFromInputs();

  if (!connection || connection.state !== "Connected") return;

  // Llama al método LeaveRoom del Hub
  await connection.invoke("LeaveRoom", room, user);

  // Actualiza estado interno
  STATE.leftRoom();

  // Actualiza UI para modo "fuera de sala"
  UI.msgEl.disabled = UI.btnSend.disabled = UI.btnLeave.disabled = true;
  UI.btnJoin.disabled = false;
  UI.userEl.disabled = UI.roomEl.disabled = false;

  // Limpieza visual
  UI.typingEl.textContent = "";
  UI.roomLabel.textContent = "Ninguna sala";
  UI.statusLabel.textContent = "Conéctate a una sala para empezar";
});

// -------------------------------
// SEND: enviar mensaje (click)
// -------------------------------
UI.btnSend?.addEventListener("click", async () => {
  const { user, room } = STATE.readFromInputs();
  const text = UI.msgEl.value.trim();

  // No enviar vacío
  if (!text) return;

  // Asegura conexión
  if (!connection || connection.state !== "Connected") return;

  // Llama al método SendMessage en el Hub
  await connection.invoke("SendMessage", room, user, text);

  // Limpia el input y devuelve el foco
  UI.msgEl.value = "";
  UI.msgEl.focus();
});

// -------------------------------
// SEND: Enter para enviar
// -------------------------------
UI.msgEl?.addEventListener("keydown", e => {
  // Enter envía si el botón no está deshabilitado
  if (e.key === "Enter" && !UI.btnSend.disabled) {
    e.preventDefault();
    UI.btnSend.click();
  }
});

// -------------------------------
// TYPING: avisar "está escribiendo..." con debounce
// -------------------------------
UI.msgEl.addEventListener("input", () => {
  if (!connection || connection.state !== "Connected") return;

  const now = Date.now();

  // Debounce: evita enviar demasiados eventos de typing
  if (now - STATE.lastTypingSentAt < CONFIG.typing.sendDebounceMs) return;

  const { user, room } = STATE.readFromInputs();

  // Marca el último envío para controlar el debounce
  STATE.lastTypingSentAt = now;

  // Invoca Typing en el Hub (si falla, se ignora)
  connection.invoke("Typing", room, user).catch(() => {});
});

// ===============================
// Emojis
// ===============================

// Botón para mostrar/ocultar panel de emojis
UI.emojiBtn?.addEventListener("click", (e) => {
  e.stopPropagation(); // evita que el click se propague al document y lo cierre
  const visible = UI.emojiPanel.style.display === "block";
  UI.emojiPanel.style.display = visible ? "none" : "block";
});

UI.emojiPanel.addEventListener("click", e => {
  // Evita que el click cierre el panel
  e.stopPropagation();

  // Si se hace click en un emoji, se inserta en el mensaje
  if (e.target.tagName === "SPAN") {
    UI.msgEl.value += e.target.textContent;
    UI.msgEl.focus();
  }
});

// Click fuera del panel: lo cierra
document.addEventListener("click", e => {
  if (!UI.emojiPanel.contains(e.target) && e.target !== UI.emojiBtn) {
    UI.emojiPanel.style.display = "none";
  }
});

// ===============================
// Stickers
// ===============================

// Envía el sticker como mensaje (data-sticker contiene el texto/icono)
UI.stickerButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const icon = btn.getAttribute("data-sticker") || "";
    if (!icon) return;

    const { user, room } = STATE.readFromInputs();

    if (!connection || connection.state !== "Connected") return;

    await connection.invoke("SendMessage", room, user, icon);
  });
});

// ===============================
// ZUMBIDO (botón)
// ===============================

// Se valida que exista el botón en el DOM
if (UI.buzzBtn) {
  UI.buzzBtn.addEventListener("click", async () => {
    // Si buzz está deshabilitado en config, no hace nada
    if (!CONFIG.buzz.enabled) return;

    // Si no hay conexión, muestra aviso en el chat
    if (!connection || connection.state !== "Connected") {
      addSystem("⚠️ No estás conectado aún.");
      return;
    }

    const now = Date.now();

    // Cooldown: evita que el usuario envíe buzz seguido
    if (now - (STATE.lastBuzzAt || 0) < CONFIG.buzz.cooldownMs) {
      addSystem("⏳ Espera un momento antes de enviar otro zumbido");
      return;
    }

    const { user, room } = STATE.readFromInputs();
    STATE.lastBuzzAt = now;

    // Se envía el buzz como un mensaje especial (clave CONFIG.buzz.key)
    await connection.invoke("SendMessage", room, user, CONFIG.buzz.key);

    // Efecto local inmediato (sonido + sacudida)
    playBuzz?.();
    triggerBuzzUI?.();
  });
} else {
  // Aviso en consola si el botón no existe
  console.warn("No se encontró #buzzBtn en el DOM");
}
