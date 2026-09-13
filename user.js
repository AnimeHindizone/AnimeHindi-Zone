// ═══════════════════════════════════════════
// ANIME HINDI ZONE - USER SYSTEM
// ═══════════════════════════════════════════

window.ToonUser = {
  get: function() {
    try {
      const u = localStorage.getItem("toonflix_user");
      return u ? JSON.parse(u) : null;
    } catch (e) { return null; }
  },
  set: function(name, email) {
    const user = {
      name: name || "Guest", email: email || "",
      id: "u_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      createdAt: Date.now()
    };
    localStorage.setItem("toonflix_user", JSON.stringify(user));
    return user;
  },
  logout: function() { localStorage.removeItem("toonflix_user"); },
  isLoggedIn: function() { return !!this.get(); }
};

window.ToonTheme = {
  get: function() { return localStorage.getItem("toonflix_theme") || "dark"; },
  set: function(theme) {
    localStorage.setItem("toonflix_theme", theme);
    this.apply(theme);
  },
  toggle: function() {
    const next = this.get() === "dark" ? "light" : "dark";
    this.set(next);
    return next;
  },
  apply: function(theme) {
    const t = theme || this.get();
    if (t === "light") document.body.classList.add("light-theme");
    else document.body.classList.remove("light-theme");
  }
};

window.ToonFav = {
  getAll: function() {
    try { return JSON.parse(localStorage.getItem("toonflix_favorites") || "[]"); }
    catch (e) { return []; }
  },
  isFav: function(animeId) { return this.getAll().some(f => f.id === animeId); },
  add: function(anime) {
    const list = this.getAll();
    if (list.some(f => f.id === anime.id)) return list;
    list.unshift({ id: anime.id, title: anime.title, poster: anime.poster, rating: anime.rating, year: anime.year, addedAt: Date.now() });
    localStorage.setItem("toonflix_favorites", JSON.stringify(list.slice(0, 200)));
    return list;
  },
  remove: function(animeId) {
    const list = this.getAll().filter(f => f.id !== animeId);
    localStorage.setItem("toonflix_favorites", JSON.stringify(list));
    return list;
  },
  toggle: function(anime) {
    if (this.isFav(anime.id)) { this.remove(anime.id); return false; }
    else { this.add(anime); return true; }
  }
};

window.ToonRating = {
  getAll: function() {
    try { return JSON.parse(localStorage.getItem("toonflix_ratings") || "{}"); }
    catch (e) { return {}; }
  },
  get: function(animeId) { return this.getAll()[animeId] || 0; },
  set: function(animeId, rating) {
    const all = this.getAll();
    all[animeId] = rating;
    localStorage.setItem("toonflix_ratings", JSON.stringify(all));
  }
};

window.ToonNotif = {
  getAll: function() {
    try { return JSON.parse(localStorage.getItem("toonflix_notifications") || "[]"); }
    catch (e) { return []; }
  },
  add: function(notif) {
    const list = this.getAll();
    list.unshift({ id: "n_" + Date.now(), title: notif.title || "", message: notif.message || "", link: notif.link || "#", icon: notif.icon || "🔔", time: Date.now(), read: false });
    localStorage.setItem("toonflix_notifications", JSON.stringify(list.slice(0, 50)));
  },
  unreadCount: function() { return this.getAll().filter(n => !n.read).length; }
};

window.ToonLang = {
  get: function() { return localStorage.getItem("toonflix_lang") || "hi"; },
  set: function(lang) {
    localStorage.setItem("toonflix_lang", lang);
    this.apply(lang);
  },
  toggle: function() {
    const next = this.get() === "hi" ? "en" : "hi";
    this.set(next);
    return next;
  },
  apply: function(lang) {
    const l = lang || this.get();
    document.documentElement.lang = l;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const text = window.I18N && window.I18N[l] && window.I18N[l][key];
      if (text) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.placeholder = text;
        else el.textContent = text;
      }
    });
  }
};

(function autoInit() {
  ToonTheme.apply();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => ToonLang.apply());
  } else {
    ToonLang.apply();
  }
  console.log("✅ Anime Hindi Zone user system loaded");
})();
