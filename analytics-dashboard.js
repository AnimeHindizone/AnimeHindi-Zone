// ═══════════════════════════════════════════
// ANIME HINDI ZONE - ANALYTICS DASHBOARD
// ═══════════════════════════════════════════

const firebaseConfig = {
  databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const analyticsRef = db.ref("analytics");

analyticsRef.on("value", (snap) => {
  const data = snap.val() || {};
  const today = getTodayKey();
  const todayData = data.daily?.[today] || {};

  document.getElementById("todayUsers").textContent = Object.keys(todayData.visitors || {}).length;
  document.getElementById("todayViews").textContent = todayData.pageviews || 0;
  document.getElementById("totalViews").textContent = data.total?.pageviews || 0;
  document.getElementById("totalUsers").textContent = Object.keys(data.users || {}).length;

  renderChart(data.daily || {});
  renderTopAnime(data.episodes || {});
  renderDevices(data.devices || {});
  renderPages(data.pages || {});
  renderRecent(data.recent || {});
  renderAllDays(data.daily || {});
});

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function renderChart(daily) {
  const el = document.getElementById("chartBars");
  if (!el) return;
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const dayData = daily[key] || {};
    last7.push({
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: d.getDate(),
      users: Object.keys(dayData.visitors || {}).length
    });
  }
  const maxUsers = Math.max(...last7.map(d => d.users), 1);
  el.innerHTML = last7.map(d => {
    const h = (d.users / maxUsers) * 100;
    return `<div class="chart-bar-wrap">
      <div class="chart-bar-value">${d.users}</div>
      <div class="chart-bar" style="height: ${Math.max(h, 5)}%"></div>
      <div class="chart-bar-label"><strong>${d.label}</strong><small>${d.date}</small></div>
    </div>`;
  }).join("");
}

function renderTopAnime(episodes) {
  const el = document.getElementById("topAnimeList");
  if (!el) return;
  const list = Object.entries(episodes)
    .map(([id, a]) => ({ id, title: a.title || "Untitled", plays: a.plays || 0, lastPlayed: a.lastPlayed || 0 }))
    .sort((x, y) => y.plays - x.plays).slice(0, 10);
  if (!list.length) { el.innerHTML = '<p class="empty-msg">No data.</p>'; return; }
  el.innerHTML = list.map((a, i) => `
    <div class="top-item">
      <div class="top-rank">${i + 1}</div>
      <div class="top-info"><strong>${a.title}</strong><small>Last: ${a.lastPlayed ? timeAgo(a.lastPlayed) : "never"}</small></div>
      <div class="top-plays"><span>▶ ${a.plays}</span><small>plays</small></div>
    </div>`).join("");
}

function renderDevices(devices) {
  const el = document.getElementById("deviceGrid");
  if (!el) return;
  const total = Object.values(devices).reduce((a, b) => a + b, 0) || 1;
  const icons = { Mobile: "📱", Desktop: "💻", Tablet: "📲" };
  el.innerHTML = Object.entries(devices).map(([d, c]) => {
    const p = ((c / total) * 100).toFixed(1);
    return `<div class="device-card">
      <div class="device-icon">${icons[d] || "🌐"}</div>
      <div class="device-info"><strong>${d}</strong><p>${c} views (${p}%)</p></div>
    </div>`;
  }).join("") || '<p class="empty-msg">No data.</p>';
}

function renderPages(pages) {
  const el = document.getElementById("pageList");
  if (!el) return;
  const total = Object.values(pages).reduce((a, b) => a + b, 0) || 1;
  const icons = { home: "🏠", "anime-detail": "📺", watch: "▶️", login: "🔐", admin: "⚙️", analytics: "📊" };
  el.innerHTML = Object.entries(pages).sort((a, b) => b[1] - a[1]).map(([p, c]) => {
    const pc = ((c / total) * 100).toFixed(1);
    return `<div class="page-item">
      <div class="page-icon">${icons[p] || "📄"}</div>
      <div class="page-info"><strong>${p}</strong><div class="page-bar-bg"><div class="page-bar-fill" style="width: ${pc}%"></div></div></div>
      <div class="page-count">${c}</div>
    </div>`;
  }).join("") || '<p class="empty-msg">No data.</p>';
}

function renderRecent(recent) {
  const el = document.getElementById("recentList");
  if (!el) return;
  const list = Object.entries(recent).map(([k, v]) => ({ ...v, key: k })).sort((a, b) => b.time - a.time).slice(0, 20);
  if (!list.length) { el.innerHTML = '<p class="empty-msg">No recent visitors.</p>'; return; }
  const icons = { Mobile: "📱", Desktop: "💻", Tablet: "📲" };
  el.innerHTML = list.map(v => `
    <div class="recent-item">
      <div class="recent-device">${icons[v.device] || "🌐"}</div>
      <div class="recent-info"><strong>${v.page || "unknown"}</strong><small>${v.visitorId || "Anon"}</small></div>
      <div class="recent-time">${timeAgo(v.time)}</div>
    </div>`).join("");
}

function renderAllDays(daily) {
  const el = document.getElementById("allDaysList");
  if (!el) return;
  const list = Object.entries(daily).map(([date, d]) => ({
    date,
    users: Object.keys(d.visitors || {}).length,
    views: d.pageviews || 0,
    plays: d.episodePlays || 0
  })).sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) { el.innerHTML = '<p class="empty-msg">No data.</p>'; return; }
  el.innerHTML = `<div class="all-days-table">
    <div class="all-days-header"><span>Date</span><span>Users</span><span>Views</span><span>Plays</span></div>
    ${list.map(d => `<div class="all-days-row ${d.date === getTodayKey() ? 'today' : ''}">
      <span>${d.date}</span><span>👥 ${d.users}</span><span>📄 ${d.views}</span><span>▶️ ${d.plays}</span>
    </div>`).join("")}
  </div>`;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
                   }
