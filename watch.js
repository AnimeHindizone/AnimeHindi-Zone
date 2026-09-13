// ═══════════════════════════════════════════
// ANIME HINDI ZONE - WATCH PAGE
// ═══════════════════════════════════════════

const firebaseConfig = { databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const animeRef = db.ref("anime");

let currentAnime = null;
let currentEpNum = 0;
let allEpisodes = [];

function goBack() {
  const p = new URLSearchParams(window.location.search);
  const id = p.get("anime");
  if (id) window.location.href = `anime.html?id=${id}`;
  else window.location.href = "index.html";
}

function loadWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("anime");
  const epNum = parseInt(params.get("ep") || "1");
  const el = document.getElementById("watchContainer");
  if (!animeId) { el.innerHTML = "<p class='empty-msg'>Anime not found.</p>"; return; }

  animeRef.child(animeId).on("value", (snap) => {
    const a = snap.val();
    if (!a) { el.innerHTML = "<p class='empty-msg'>Anime not found.</p>"; return; }
    currentAnime = { id: animeId, ...a };
    currentEpNum = epNum;
    allEpisodes = [];
    if (a.episodes) allEpisodes = Object.entries(a.episodes).map(([eid, ep]) => ({ eid, ...ep })).sort((x, y) => x.number - y.number);

    const currentEp = allEpisodes.find(e => e.number === epNum);
    if (!currentEp) {
      el.innerHTML = `<div style="padding:40px 20px;text-align:center;"><h2>${a.title}</h2><p class="empty-msg">Episode ${epNum} nahi mila.</p><a href="anime.html?id=${animeId}" class="primary-btn" style="display:inline-block;padding:12px 24px;text-decoration:none;">← Wapas</a></div>`;
      return;
    }
    saveProgress(currentAnime, currentEp);
    const idx = allEpisodes.findIndex(e => e.number === epNum);
    const prevEp = idx > 0 ? allEpisodes[idx - 1] : null;
    const nextEp = idx < allEpisodes.length - 1 ? allEpisodes[idx + 1] : null;
    const servers = [];
    if (currentEp.q480) servers.push({ name: "480p", link: currentEp.q480, icon: "📺" });
    if (currentEp.q720) servers.push({ name: "720p", link: currentEp.q720, icon: "🎬" });
    if (currentEp.q1080) servers.push({ name: "1080p", link: currentEp.q1080, icon: "💎" });
    if (currentEp.q4k) servers.push({ name: "4K", link: currentEp.q4k, icon: "🎥" });
    if (!servers.length) {
      if (currentEp.streaming) servers.push({ name: "Server 1", link: currentEp.streaming });
      if (currentEp.streaming2) servers.push({ name: "Server 2", link: currentEp.streaming2 });
      if (currentEp.streaming3) servers.push({ name: "Server 3", link: currentEp.streaming3 });
      if (currentEp.link) servers.push({ name: "Server 1", link: currentEp.link });
    }
    renderPlayer(a, currentEp, servers, prevEp, nextEp);
  });
}

function renderPlayer(anime
