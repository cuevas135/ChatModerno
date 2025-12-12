// ===============================
// ui.js - Render / UI helpers
// ===============================

// Cache de elementos DOM
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
};

window.scrollBottom = function scrollBottom() {
  UI.logEl.scrollTop = UI.logEl.scrollHeight;
};

window.addSystem = function addSystem(text) {
  const div = document.createElement("div");
  div.className = "system-msg";
  div.textContent = text;
  UI.logEl.appendChild(div);
  scrollBottom();
};

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

  const userSpan = document.createElement("span");
  userSpan.className = "user";
  userSpan.textContent = user;
  bubble.appendChild(userSpan);

  const textSpan = document.createElement("span");
  textSpan.innerHTML = safe(text);
  bubble.appendChild(textSpan);

  const meta = document.createElement("div");
  meta.className = "meta";
  const timeSpan = document.createElement("span");
  timeSpan.textContent = atUtc ? fmtTime(atUtc) : "";
  meta.appendChild(timeSpan);
  bubble.appendChild(meta);

  row.appendChild(bubble);
  UI.logEl.appendChild(row);
  scrollBottom();
};

// Typing indicator (con timeout)
let typingTimer = null;
window.showTyping = function showTyping(user) {
  UI.typingEl.textContent = `${user} está escribiendo...`;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => (UI.typingEl.textContent = ""), CONFIG.typing.timeoutMs);
};
