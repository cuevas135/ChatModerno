(() => {
  const app = document.getElementById("appRoot");
  const menuBtn = document.getElementById("menuBtn");
  const overlay = document.getElementById("sidebarOverlay");

  if (!app || !menuBtn || !overlay) return;

  const open = () => app.classList.add("sidebar-open");
  const close = () => app.classList.remove("sidebar-open");
  const toggle = () => app.classList.toggle("sidebar-open");

  menuBtn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);

  // Cierra el sidebar al unirte (opcional, cómodo en móvil)
  const join = document.getElementById("join");
  if (join) join.addEventListener("click", close);

  // Si cambias tamaño a desktop, asegúrate que quede cerrado
  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) close();
  });
})();
