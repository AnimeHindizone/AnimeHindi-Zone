// ═══════════════════════════════════════════
// ANIME HINDI ZONE - PROFILE PAGE
// ═══════════════════════════════════════════

function renderProfile() {
  const user = ToonUser.get();
  const card = document.getElementById("profileCard");
  if (!card) return;

  if (!user) {
    card.innerHTML = `
      <div class="login-section">
        <h2>👤 Create Profile</h2>
        <p>Apna naam daalo — favorites aur history save hoga</p>
        <input id="userNameInput" placeholder="Aapka naam..." maxlength="30">
        <input id="userEmailInput" placeholder="Email (optional)" maxlength="50">
        <button class="primary-btn" onclick="createProfile()">Create Profile</button>
      </div>`;
  } else {
    const favCount = ToonFav.getAll().length;
    const ratedCount = Object.keys(ToonRating.getAll()).length;
    const historyCount = JSON.parse(localStorage.getItem("toonflix_history") || "[]").length;
    card.innerHTML = `
      <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <h2>${user.name}</h2>
        ${user.email ? `<p>${user.email}</p>` : ''}
        <p class="user-since">Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="user-stats">
        <div class="stat"><strong>${favCount}</strong><small>Favorites</small></div>
        <div class="stat"><strong>${ratedCount}</strong><small>Rated</small></div>
        <div class="stat"><strong>${historyCount}</strong><small>Watched</small></div>
      </div>
      <button class="logout-btn" onclick="logoutProfile()">Logout</button>`;
  }
}

function createProfile() {
  const name = document.getElementById("userNameInput").value.trim();
  const email = document.getElementById("userEmailInput").value.trim();
  if (!name) { alert("Naam daalo!"); return; }
  ToonUser.set(name, email);
  renderProfile();
  renderAllTabs();
  alert("✅ Profile created!");
}

function logoutProfile() {
  if (!confirm("Logout?")) return;
  ToonUser.logout();
  renderProfile();
  renderAllTabs();
}

document.querySelectorAll(".profile-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".profile-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".profile-tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
  });
});

function renderFavorites() {
  const el = document.getElementById("favoritesGrid");
  const list = ToonFav.getAll();
  if (!list.length) { el.innerHTML = '<p class="empty-msg">❤️ Abhi koi favorite nahi. Cards pe heart icon click karo!</p>'; return; }
  el.innerHTML = list.map(a => `
    <div class="anime-card" onclick="location.href='anime.html?id=${a.id}'">
      <img src="${a.poster || 'https://via.placeholder.com/300x400'}">
      <div class="card-info"><h3>${a.title}</h3><p>${a.rating ? "⭐ " + a.rating : ""}</p></div>
      <button class="unfav-btn" onclick="event.stopPropagation();unfav('${a.id}')">✕</button>
    </div>`).join("");
}

function unfav(id) { ToonFav.remove(id); renderFavorites(); renderProfile(); }

function renderRated() {
  const el = document.getElementById("ratedGrid");
  const ratings = ToonRating.getAll();
  const ids = Object.keys(ratings);
  if (!ids.length) { el.innerHTML = '<p class="empty-msg">⭐ Abhi koi rating nahi di.</p>'; return; }
  if (typeof firebase === "undefined") { el.innerHTML = '<p class="empty-msg">Firebase load nahi hua.</p>'; return; }
  const db = firebase.database();
  Promise.all(ids.map(id => db.ref("anime/" + id).once("value").then(s => ({ id, ...s.val() }))))
    .then(list => {
      el.innerHTML = list.filter(a => a.title).map(a => `
        <div class="anime-card" onclick="location.href='anime.html?id=${a.id}'">
          <img src="${a.poster || 'https://via.placeholder.com/300x400'}">
          <div class="card-info"><h3>${a.title}</h3><p>Your rating: ${"⭐".repeat(ratings[a.id])}</p></div>
        </div>`).join("");
    });
}

function renderHistory() {
  const el = document.getElementById("historyGrid");
  const history = JSON.parse(localStorage.getItem("toonflix_history") || "[]");
  if (!history.length) { el.innerHTML = '<p class="empty-msg">🕐 Abhi kuch nahi dekha.</p>'; return; }
  el.innerHTML = history.map(h => `
    <div class="anime-card" onclick="location.href='watch.html?anime=${h.animeId}&ep=${h.epNumber}'">
      <img src="${h.poster || 'https://via.placeholder.com/300x400'}">
      <div class="card-info"><h3>${h.title}</h3><p>EP ${h.epNumber}</p></div>
    </div>`).join("");
}

function renderAllTabs() {
  renderFavorites();
  renderRated();
  renderHistory();
}

document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  renderAllTabs();
});
