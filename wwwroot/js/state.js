// ===============================
// state.js - Estado de la aplicación
// ===============================

window.STATE = {
  // Datos actuales de sesión
  user: "",
  room: "",

  // Estado de conexión
  isConnected: false,
  isInRoom: false,

  // Control de typing (para no spamear)
  lastTypingSentAt: 0,

  // Inicializa el estado leyendo inputs (o defaults)
  readFromInputs() {
    const u = (window.UI?.userEl?.value || "").trim();
    const r = (window.UI?.roomEl?.value || "").trim();

    this.user = u || CONFIG.defaults.user;
    this.room = r || CONFIG.defaults.room;

    return { user: this.user, room: this.room };
  },

  // Actualiza estado cuando entras a sala
  enteredRoom(user, room) {
    this.user = user;
    this.room = room;
    this.isInRoom = true;
  },

  // Actualiza estado cuando sales
  leftRoom() {
    this.isInRoom = false;
  },

  // Para usar cuando cambie el estado de conexión
  setConnected(isConnected) {
    this.isConnected = isConnected;
  },
};
