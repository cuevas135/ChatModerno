// ===============================
// state.js - Estado de la aplicación
// ===============================

window.STATE = {
  // -------------------------------
  // Datos actuales de la sesión
  // -------------------------------
  user: "",
  room: "",

  // -------------------------------
  // Estado de conexión
  // -------------------------------
  isConnected: false,
  isInRoom: false,

  // -------------------------------
  // Control de eventos (anti-spam)
  // -------------------------------
  lastTypingSentAt: 0,
  lastBuzzAt: 0,

  // -------------------------------
  // Persistencia (opcional, recomendado)
  // -------------------------------
  storageKey: "chatmoderno.state",

  hydrate() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;

      const data = JSON.parse(raw);
      this.user = (data.user || "").trim();
      this.room = (data.room || "").trim();
      this.isInRoom = !!data.isInRoom;
    } catch {
      // si localStorage está corrupto, ignoramos
    }
  },

  persist() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          user: this.user,
          room: this.room,
          isInRoom: this.isInRoom
        })
      );
    } catch {
      // si el navegador bloquea storage, ignoramos
    }
  },

  // -------------------------------
  // Lee los inputs (sin romper STATE)
  // -------------------------------
  readFromInputs() {
    const u = (window.UI?.userEl?.value || "").trim();
    const r = (window.UI?.roomEl?.value || "").trim();

    // ✅ prioridad:
    // 1) input (si tiene valor)
    // 2) STATE (si ya tiene valor, útil si inputs están disabled)
    // 3) defaults
    this.user = u || this.user || CONFIG.defaults.user;
    this.room = r || this.room || CONFIG.defaults.room;

    this.persist();
    return { user: this.user, room: this.room };
  },

  // -------------------------------
  // Manejo de sala
  // -------------------------------
  enteredRoom(user, room) {
    this.user = (user || "").trim() || CONFIG.defaults.user;
    this.room = (room || "").trim() || CONFIG.defaults.room;
    this.isInRoom = true;
    this.persist();
  },

  leftRoom() {
    this.isInRoom = false;

    // ✅ recomendable: si sales, ya no hay sala activa
    this.room = "";
    this.persist();
  },

  // -------------------------------
  // Manejo de conexión
  // -------------------------------
  setConnected(isConnected) {
    this.isConnected = !!isConnected;
  }
};

// ✅ Hidrata apenas carga state.js
window.STATE.hydrate();
