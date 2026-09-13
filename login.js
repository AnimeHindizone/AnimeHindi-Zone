// ═══════════════════════════════════════════
// ANIME HINDI ZONE - LOGIN SYSTEM
// ═══════════════════════════════════════════

const ADMIN_PASSWORD = "AnimeHindiZone123";

function handleLogin(e) {
  e.preventDefault();
  const input = document.getElementById("passwordInput").value;
  const errorEl = document.getElementById("loginError");
  if (input === ADMIN_PASSWORD) {
    sessionStorage.setItem("toonflix_admin", "true");
    localStorage.setItem("toonflix_admin", "true");
    errorEl.textContent = "";
    window.location.href = "admin.html";
  } else {
    errorEl.textContent = "❌ Galat password! Dobara try karein.";
    document.getElementById("passwordInput").value = "";
    document.getElementById("passwordInput").focus();
  }
}

if (sessionStorage.getItem("toonflix_admin") === "true" ||
    localStorage.getItem("toonflix_admin") === "true") {
  window.location.href = "admin.html";
}
