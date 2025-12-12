// ===============================
// theme.js - Tema claro / oscuro
// ===============================

(function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  function setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(CONFIG.theme.storageKey, theme);

    const isLight = theme === "light";
    if (themeIcon) themeIcon.textContent = isLight ? "light_mode" : "dark_mode";
    if (themeText) themeText.textContent = isLight ? "Claro" : "Oscuro";
  }

  // Tema inicial
  setTheme(localStorage.getItem(CONFIG.theme.storageKey) || CONFIG.theme.default);

  // Toggle
  themeToggle?.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });

  // export opcional si lo necesitas
  window.setTheme = setTheme;
})();
