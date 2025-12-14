// ===============================
// theme.js - Tema claro / oscuro
// ===============================

// IIFE (Immediately Invoked Function Expression)
// Encapsula la lógica del tema para no contaminar el scope global
(function initTheme() {

  // -------------------------------
  // Elementos del DOM
  // -------------------------------

  const themeToggle = document.getElementById("themeToggle"); // Botón toggle
  const themeIcon   = document.getElementById("themeIcon");   // Icono (material icons)
  const themeText   = document.getElementById("themeText");   // Texto del tema

  // -------------------------------
  // Aplicar tema
  // -------------------------------

  // Aplica el tema seleccionado y lo guarda en localStorage
  function setTheme(theme) {
    // Asigna el tema al body (usado por CSS)
    document.body.setAttribute("data-theme", theme);

    // Persiste el tema seleccionado
    localStorage.setItem(CONFIG.theme.storageKey, theme);

    // Determina si el tema es claro
    const isLight = theme === "light";

    // Actualiza icono y texto del botón
    if (themeIcon) {
      themeIcon.textContent = isLight ? "light_mode" : "dark_mode";
    }

    if (themeText) {
      themeText.textContent = isLight ? "Claro" : "Oscuro";
    }
  }

  // -------------------------------
  // Tema inicial
  // -------------------------------

  // Aplica el tema guardado o el tema por defecto
  setTheme(
    localStorage.getItem(CONFIG.theme.storageKey) ||
    CONFIG.theme.default
  );

  // -------------------------------
  // Toggle de tema
  // -------------------------------

  // Cambia entre tema claro y oscuro al hacer click
  themeToggle?.addEventListener("click", () => {
    const current =
      document.body.getAttribute("data-theme") || "dark";

    setTheme(current === "dark" ? "light" : "dark");
  });

  // -------------------------------
  // Export opcional
  // -------------------------------

  // Permite cambiar el tema desde otros scripts si es necesario
  window.setTheme = setTheme;

})();
