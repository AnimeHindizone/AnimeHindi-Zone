// ═══════════════════════════════════════════
// ANIME HINDI ZONE - WATCH PAGE
// Season System + Legacy Episodes Support
// ═══════════════════════════════════════════

const firebaseConfig = {
  databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const animeRef = db.ref("anime");

let currentAnime = null;
let currentEpNum = 0;
let currentSeason = "Season_1";
let allEpisodes = [];
let allSeasons = [];

// ═══ BACK BUTTON ═══
function goBack() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("anime");
  if (animeId) window.location.href = `anime.html?id=${animeId}`;
  else window.location.href = "index.html";
}

// ═══════════════════════════════════════════
// LOAD WATCH PAGE
// ═══════════════════════════════════════════
function loadWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("anime");
  const seasonParam = params.get("season") || "Season_1";
  const epNum = parseInt(params.get("ep") || "1");
  const el = document.getElementById("watchContainer");

  if (!animeId) {
    el.innerHTML = "<p class='empty-msg'>Anime not found.</p>";
    return;
  }

  console.log("🎬 Loading:", animeId, "Season:", seasonParam, "EP:", epNum);

  animeRef.child(animeId).on("value", (snap) => {
    const a = snap.val();
    if (!a) {
      el.innerHTML = "<p class='empty-msg'>Anime not found.</p>";
      return;
    }

    currentAnime = { id: animeId, ...a };
    currentEpNum = epNum;
    currentSeason = seasonParam;

    // ═══════════════════════════════════════════
    // SEASON SYSTEM DETECTION
    // ═══════════════════════════════════════════

    // Priority 1: Naya seasons structure
    if (a.seasons && Object.keys(a.seasons).length > 0) {
      allSeasons = Object.keys(a.seasons)
        .filter(k => !k.startsWith("_"))
        .sort((x, y) => {
          const nx = parseInt(x.replace(/\D/g, "")) || 0;
          const ny = parseInt(y.replace(/\D/g, "")) || 0;
          return nx - ny;
        });

      // Agar season valid nahi hai toh first select karo
      if (!allSeasons.includes(currentSeason)) {
        currentSeason = allSeasons[0];
      }

      const seasonData = a.seasons[currentSeason] || {};
      allEpisodes = Object.entries(seasonData)
        .filter(([k, v]) => !k.startsWith("_"))
        .map(([eid, ep]) => ({ eid, ...ep }))
        .sort((x, y) => x.number - y.number);

      console.log("📺 Season:", currentSeason, "Episodes:", allEpisodes.length);
    }
    // Priority 2: Purane episodes structure (legacy)
    else if (a.episodes && Object.keys(a.episodes).length > 0) {
      allSeasons = ["Season_1"];
      currentSeason = "Season_1";
      allEpisodes = Object.entries(a.episodes)
        .map(([eid, ep]) => ({ eid, ...ep }))
        .sort((x, y) => x.number - y.number);

      console.log("📼 Legacy episodes:", allEpisodes.length);
    }
    else {
      allSeasons = [];
      allEpisodes = [];
    }

    // ═══ Current Episode dhundho ═══
    const currentEp = allEpisodes.find(e => e.number === epNum);

    if (!currentEp) {
      el.innerHTML = `
        <div style="padding:60px 20px;text-align:center;">
          <h2 style="font-size:1.4rem;font-weight:800;color:#67e8f9;margin-bottom:12px;">
            ${a.title || "Untitled"}
          </h2>
          <p class="empty-msg" style="display:inline-block;padding:20px 30px;margin-bottom:20px;">
            ⚠️ Episode ${epNum} nahi mila.<br>
            <small style="font-size:0.75rem;color:#94a3b8;margin-top:8px;display:block;">
              Season: ${currentSeason.replace(/_/g, " ")} • Total: ${allEpisodes.length} episodes
            </small>
          </p>
          <div>
            <a href="anime.html?id=${encodeURIComponent(animeId)}" 
               class="primary-btn" 
               style="display:inline-block;padding:12px 24px;text-decoration:none;max-width:250px;">
              ← Wapas Anime Page
            </a>
          </div>
        </div>
      `;
      return;
    }

    // ═══ Progress Save ═══
    saveProgress(currentAnime, currentEp, currentSeason);

    // ═══ Next/Prev Episode ═══
    const idx = allEpisodes.findIndex(e => e.number === epNum);
    const prevEp = idx > 0 ? allEpisodes[idx - 1] : null;
    const nextEp = idx < allEpisodes.length - 1 ? allEpisodes[idx + 1] : null;

    // ═══ Servers (multi-quality) ═══
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

// ═══════════════════════════════════════════
// RENDER PLAYER
// ═══════════════════════════════════════════
function renderPlayer(anime, ep, servers, prevEp, nextEp) {
  const el = document.getElementById("watchContainer");
  const embedUrl = servers[0]?.link || "";
  const comments = JSON.parse(localStorage.getItem(`comments_${anime.id}_${ep.number}`) || "[]");
  const safeAnimeId = encodeURIComponent(anime.id);
  const safeSeason = encodeURIComponent(currentSeason);

  // ═══ Season Tabs (agar 1 se zyada season hai) ═══
  let seasonTabsHTML = "";
  if (allSeasons.length > 1) {
    seasonTabsHTML = `
      <div class="season-tabs">
        ${allSeasons.map(sk => `
          <button class="season-tab ${sk === currentSeason ? 'active' : ''}" 
                  onclick="switchSeasonWatch('${safeAnimeId}','${encodeURIComponent(sk)}')">
            📺 ${sk.replace(/_/g, " ")}
          </button>
        `).join("")}
      </div>
    `;
  }

  el.innerHTML = `
    <div class="watch-header">
      <h1>${anime.title || "Untitled"}</h1>
      <p class="watch-ep-title">
        Episode ${ep.number}${ep.title ? ": " + ep.title : ""} 
        • ${currentSeason.replace(/_/g, " ")}
      </p>
    </div>

    ${seasonTabsHTML}

    <div class="video-wrapper">
      ${embedUrl
        ? `<iframe src="${embedUrl}" allowfullscreen frameborder="0" allow="autoplay; encrypted-media; picture-in-picture"></iframe>`
        : `<div class="video-placeholder">⚠️ Is episode ka video link nahi hai</div>`
      }
    </div>

    ${servers.length > 1 ? `
      <div class="server-selector">
        <p class="server-label">🎬 Quality / Servers:</p>
        <div class="server-btns">
          ${servers.map((s, i) => `
            <button class="server-btn ${i === 0 ? 'active' : ''}" onclick="switchServer('${s.link}', this)">
              ${s.icon || "🎬"} ${s.name}
            </button>
          `).join("")}
        </div>
      </div>
    ` : ""}

    <div class="watch-actions">
      ${ep.telegram ? `<a href="${ep.telegram}" target="_blank" rel="noopener" class="watch-action-btn telegram">📱 Telegram</a>` : ""}
      ${ep.download ? `<a href="${ep.download}" target="_blank" rel="noopener" class="watch-action-btn download">⬇️ Download</a>` : ""}
      <button class="watch-action-btn comment" onclick="toggleComments()">💬 Comments (${comments.length})</button>
    </div>

    <div class="comments-section" id="commentsSection" style="display:none;">
      <h3>💬 Comments</h3>
      <div class="comment-form">
        <input id="commentName" placeholder="Aapka naam..." maxlength="30">
        <textarea id="commentText" placeholder="Comment likhein..." maxlength="300"></textarea>
        <button onclick="addComment()" class="comment-post-btn">Post Comment</button>
      </div>
      <div class="comments-list" id="commentsList">
        ${comments.length ? comments.map(c => `
          <div class="comment-item">
            <div class="comment-header">
              <strong>${c.name}</strong>
              <small>${timeAgo(c.time)}</small>
            </div>
            <p>${c.text}</p>
          </div>
        `).join("") : '<p class="empty-msg">Abhi koi comment nahi hai.</p>'}
      </div>
    </div>

    <div class="ep-nav">
      ${prevEp
        ? `<a href="watch.html?anime=${safeAnimeId}&season=${safeSeason}&ep=${prevEp.number}" class="ep-nav-btn">⏮️ EP ${prevEp.number}</a>`
        : `<button class="ep-nav-btn disabled" disabled>⏮️ No Previous</button>`
      }
      ${nextEp
        ? `<a href="watch.html?anime=${safeAnimeId}&season=${safeSeason}&ep=${nextEp.number}" class="ep-nav-btn next">EP ${nextEp.number} ⏭️</a>`
        : `<button class="ep-nav-btn disabled" disabled>No Next ⏭️</button>`
      }
    </div>

    <div class="all-episodes-list">
      <h3>📺 ${currentSeason.replace(/_/g, " ")} — Saare Episodes (${allEpisodes.length})</h3>
      <div class="ep-list-grid">
        ${allEpisodes.map(e => `
          <a href="watch.html?anime=${safeAnimeId}&season=${safeSeason}&ep=${e.number}"
             class="ep-list-btn ${e.number === ep.number ? 'active' : ''}">
            <span class="ep-num">${e.number}</span>
            <span class="ep-name">${e.title || "Episode " + e.number}</span>
            ${e.telegram ? '<span class="ep-tg">📱</span>' : ''}
          </a>
        `).join("")}
      </div>
    </div>

    <div class="back-to-anime">
      <a href="anime.html?id=${safeAnimeId}" class="primary-btn" style="display:block;text-align:center;text-decoration:none;">
        ← ${anime.title} - Full Details
      </a>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ═══════════════════════════════════════════
// SEASON SWITCH (WATCH PAGE)
// ═══════════════════════════════════════════
window.switchSeasonWatch = function(encodedAnimeId, encodedSeason) {
  const animeId = decodeURIComponent(encodedAnimeId);
  const season = decodeURIComponent(encodedSeason);
  window.location.href = `watch.html?anime=${encodeURIComponent(animeId)}&season=${encodeURIComponent(season)}&ep=1`;
};

// ═══════════════════════════════════════════
// SWITCH SERVER
// ═══════════════════════════════════════════
function switchServer(link, btn) {
  document.querySelectorAll(".server-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const iframe = document.querySelector(".video-wrapper iframe");
  if (iframe) iframe.src = link;
}

// ═══════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════
function toggleComments() {
  const s = document.getElementById("commentsSection");
  s.style.display = s.style.display === "none" ? "block" : "none";
  if (s.style.display === "block") s.scrollIntoView({ behavior: "smooth" });
}

function addComment() {
  const name = document.getElementById("commentName").value.trim() || "Anonymous";
  const text = document.getElementById("commentText").value.trim();
  if (!text) { alert("Comment likho!"); return; }
  const key = `comments_${currentAnime.id}_${currentEpNum}`;
  const comments = JSON.parse(localStorage.getItem(key) || "[]");
  comments.unshift({ name, text, time: Date.now() });
  localStorage.setItem(key, JSON.stringify(comments.slice(0, 50)));
  document.getElementById("commentText").value = "";
  loadWatchPage();
}

// ═══════════════════════════════════════════
// PROGRESS SAVE
// ═══════════════════════════════════════════
function saveProgress(anime, ep, season) {
  try {
    const history = JSON.parse(localStorage.getItem("toonflix_history") || "[]");
    const filtered = history.filter(h => h.animeId !== anime.id);
    filtered.unshift({
      animeId: anime.id,
      title: anime.title,
      poster: anime.poster,
      epNumber: ep.number,
      epTitle: ep.title || "",
      season: season || "Season_1",
      timestamp: Date.now()
    });
    localStorage.setItem("toonflix_history", JSON.stringify(filtered.slice(0, 20)));
  } catch (e) {}
}

// ═══════════════════════════════════════════
// TIME AGO
// ═══════════════════════════════════════════
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
loadWatchPage();
