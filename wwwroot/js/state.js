// ===============================
// state.js - Estado de la aplicación
// ===============================

// Objeto global que mantiene el estado actual del chat
// Centraliza información de usuario, sala, conexión y controles internos
window.STATE = {

  // -------------------------------
  // Datos actuales de la sesión
  // -------------------------------

  // Nombre del usuario actual
  user: "",

  // Sala en la que se encuentra el usuario
  room: "",

  // -------------------------------
  // Estado de conexión
  // -------------------------------

  // Indica si existe conexión activa con el servidor (SignalR)
  isConnected: false,

  // Indica si el usuario ya ingresó a una sala
  isInRoom: false,

  // -------------------------------
  // Control de eventos (anti-spam)
  // -------------------------------

  // Timestamp del último evento "typing" enviado
  // Se usa para evitar enviar demasiados eventos al servidor
  lastTypingSentAt: 0,

  // Timestamp del último "buzz" enviado
  // Permite respetar el cooldown configurado
  lastBuzzAt: 0,

  // -------------------------------
  // Inicialización del estado
  // -------------------------------

  // Lee los valores desde los inputs de la UI
  // Si están vacíos, usa los valores por defecto definidos en CONFIG
  readFromInputs() {
    // Obtiene el valor del input de usuario (si existe)
    const u = (window.UI?.userEl?.value || "").trim();

    // Obtiene el valor del input de sala (si existe)
    const r = (window.UI?.roomEl?.value || "").trim();

    // Asigna valores al estado:
    // si están vacíos, usa defaults
    this.user = u || CONFIG.defaults.user;
    this.room = r || CONFIG.defaults.room;

    // Retorna los valores normalizados
    return { user: this.user, room: this.room };
  },

  // -------------------------------
  // Manejo de estado de sala
  // -------------------------------

  // Se ejecuta cuando el usuario entra correctamente a una sala
  enteredRoom(user, room) {
    this.user = user;
    this.room = room;
    this.isInRoom = true;
  },

  // Se ejecuta cuando el usuario sale de la sala
  leftRoom() {
    this.isInRoom = false;
  },

  // -------------------------------
  // Manejo de estado de conexión
  // -------------------------------

  // Actualiza el estado de conexión con el servidor
  setConnected(isConnected) {
    this.isConnected = isConnected;
  },
};
