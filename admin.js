// ═══════════════════════════════════════════
// ANIME HINDI ZONE - ADMIN PANEL
// ═══════════════════════════════════════════

const firebaseConfig = {
  databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const animeRef = db.ref("anime");

let allAnime = [];
let currentEditId = null;

// ═══ ANILIST API ═══
const ANILIST_URL = "https://graphql.anilist.co";
const ANILIST_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 12) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title { romaji english }
        coverImage { large }
        bannerImage
        genres
        episodes
        averageScore
        popularity
        format
        status
        startDate { year }
        description(asHtml: false)
      }
    }
  }
`;

function stripHtml(html) {
  return (html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").trim();
}

function searchMAL() {
  const input = document.getElementById("malSearchInput");
  const results = document.getElementById("malResults");
  const loading = document.getElementById("malLoading");
  if (!input || !results) { alert("Search box missing!"); return; }

  const query = input.value.trim();
  if (!query) { results.innerHTML = '<p class="empty-msg">⚠️ Anime ka naam likhein</p>'; return; }

  results.innerHTML = "";
  if (loading) loading.style.display = "block";

  fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: query } })
  })
  .then(res => res.json())
  .then(data => {
    if (loading) loading.style.display = "none";
    renderAniListResults(data?.data?.Page?.media || []);
  })
  .catch(err => {
    console.error(err);
    if (loading) loading.style.display = "none";
    results.innerHTML = '<p class="empty-msg">❌ AniList se connect nahi ho paya.</p>';
  });
}

function renderAniListResults(list) {
  const el = document.getElementById("malResults");
  if (!list.length) { el.innerHTML = '<p class="empty-msg">❌ Koi match nahi mila.</p>'; return; }

  el.innerHTML = `
    <p class="search-hint-text">✅ ${list.length} results — Jo add karna hai uska <strong>Add</strong> click karo</p>
    <div class="anilist-grid">
      ${list.map(m => {
        const title = m.title.english || m.title.romaji || "Untitled";
        const year = m.startDate?.year || "";
        const rating = m.averageScore ? (m.averageScore / 10).toFixed(1) : "";
        const genre = (m.genres || []).slice(0, 2).join(", ");
        const episodes = m.episodes || "";
        const format = m.format || "TV";
        const poster = m.coverImage?.large || "";
        const dataEncoded = encodeURIComponent(JSON.stringify(m));

        return `
          <div class="anilist-card">
            <div class="anilist-poster">
              <img src="${poster}" alt="${title}" onerror="this.src='https://via.placeholder.com/300x400'">
              ${rating ? `<span class="anilist-rating">⭐ ${rating}</span>` : ''}
            </div>
            <div class="anilist-info">
              <h4>${title}</h4>
              <div class="anilist-meta">
                ${year ? `<span>📅 ${year}</span>` : ''}
                ${episodes ? `<span>🎬 ${episodes} eps</span>` : ''}
                ${format ? `<span>📺 ${format}</span>` : ''}
              </div>
              <p class="anilist-genre">${genre}</p>
              <button class="primary-btn anilist-add-btn" onclick="addFromAniListEncoded('${dataEncoded}', this)">➕ Add to Library</button>
            </div>
          </div>`;
      }).join("")}
    </div>`;
}

function addFromAniListEncoded(encodedData, btn) {
  try {
    const media = JSON.parse(decodeURIComponent(encodedData));
    addFromAniList(media, btn);
  } catch (e) { alert("Data error!"); btn.disabled = false; btn.textContent = "➕ Add"; }
}

function addFromAniList(media, btn) {
  btn.disabled = true;
  btn.textContent = "⏳ Adding...";
  const title = media.title?.english || media.title?.romaji || "Untitled";
  const year = media.startDate?.year ? String(media.startDate.year) : "";
  const rating = media.averageScore ? (media.averageScore / 10).toFixed(1) : "";
  const genres = (media.genres || []).join(", ");
  const episodes = media.episodes ? String(media.episodes) : "";
  const desc = stripHtml(media.description).slice(0, 800);

  animeRef.push({
    title, poster: media.coverImage?.large || "", banner: media.bannerImage || "",
    year, rating, genres, totalEpisodes: episodes, description: desc,
    format: media.format || "TV", anilistId: media.id, top10: false,
    createdAt: Date.now(), updatedAt: Date.now()
  }).then(() => {
    btn.textContent = "✅ Added!";
    btn.style.background = "linear-gradient(135deg, #10b981, #059669)";
    showToast(`✅ "${title}" added!`);
  }).catch(err => { btn.disabled = false; btn.textContent = "❌ Retry"; alert(err.message); });
}

animeRef.on("value", (snap) => {
  const data = snap.val() || {};
  allAnime = Object.entries(data).map(([id, val]) => ({ id, ...val }));
  renderAdminList(allAnime);
});

function renderAdminList(list) {
  const el = document.getElementById("adminList");
  if (!el) return;
  if (!list.length) { el.innerHTML = '<p class="empty-msg">No anime yet.</p>'; return; }
  el.innerHTML = list.map(a => {
    const epCount = a.episodes ? Object.keys(a.episodes).length : 0;
    return `
      <div class="admin-list-item">
        <img src="${a.poster||''}" onerror="this.src='https://via.placeholder.com/50x65'">
        <div class="info">
          <strong>${a.title||'Untitled'}</strong>
          <small>${a.year||''} ${a.rating?'⭐'+a.rating:''} • ${epCount} eps</small>
        </div>
        <button class="btn-edit" onclick="editAnime('${a.id}')">Edit</button>
        <button class="btn-episodes" onclick="openEpisodes('${a.id}','${(a.title||'').replace(/'/g,"\\'")}')">Eps</button>
        <button class="btn-delete" onclick="deleteAnime('${a.id}','${(a.title||'').replace(/'/g,"\\'")}')">Del</button>
      </div>`;
  }).join("");
}

function editAnime(id) {
  const a = allAnime.find(x => x.id === id);
  if (!a) return;
  currentEditId = id;
  document.getElementById("aTitle").value = a.title || "";
  document.getElementById("aPoster").value = a.poster || "";
  document.getElementById("aBanner").value = a.banner || "";
  document.getElementById("aYear").value = a.year || "";
  document.getElementById("aRating").value = a.rating || "";
  document.getElementById("aGenres").value = a.genres || a.genres2 || "";
  document.getElementById("aEpisodes").value = a.totalEpisodes || "";
  document.getElementById("aDesc").value = a.description || "";
  document.getElementById("aTop10").checked = !!a.top10;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteAnime(id, title) {
  if (!confirm(`"${title}" delete karein?`)) return;
  animeRef.child(id).remove().then(() => alert("🗑️ Deleted"));
}

function saveAnime() {
  const title = document.getElementById("aTitle").value.trim();
  const poster = document.getElementById("aPoster").value.trim();
  if (!title || !poster) { alert("Title aur Poster zaroori hai!"); return; }

  const anime = {
    title, poster,
    banner: document.getElementById("aBanner").value.trim(),
    year: document.getElementById("aYear").value.trim(),
    rating: document.getElementById("aRating").value.trim(),
    genres: document.getElementById("aGenres").value.trim(),
    totalEpisodes: document.getElementById("aEpisodes").value.trim(),
    description: document.getElementById("aDesc").value.trim(),
    top10: document.getElementById("aTop10").checked,
    updatedAt: Date.now()
  };

  if (currentEditId) {
    animeRef.child(currentEditId).update(anime).then(() => { alert("✅ Updated!"); resetAnimeForm(); });
  } else {
    anime.createdAt = Date.now();
    animeRef.push(anime).then(() => { alert("✅ Anime added!"); resetAnimeForm(); });
  }
}

function resetAnimeForm() {
  ["aTitle","aPoster","aBanner","aYear","aRating","aGenres","aEpisodes","aDesc"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const t = document.getElementById("aTop10");
  if (t) t.checked = false;
  currentEditId = null;
}

const adminSearchInput = document.getElementById("adminSearch");
if (adminSearchInput) {
  adminSearchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const results = document.getElementById("adminSearchResults");
    if (!q) { results.innerHTML = ""; return; }
    const filtered = allAnime.filter(a => (a.title||"").toLowerCase().includes(q));
    if (!filtered.length) { results.innerHTML = '<p class="empty-msg">No match.</p>'; return; }
    results.innerHTML = filtered.map(a => `
      <div class="anime-card" onclick="editAnime('${a.id}')">
        <img src="${a.poster||''}" onerror="this.src='https://via.placeholder.com/300x400'">
        <div class="card-info"><h3>${a.title}</h3><p>Click to edit</p></div>
      </div>`).join("");
  });
}

function openEpisodes(id, title) {
  currentEditId = id;
  document.getElementById("currentAnimeName").textContent = title;
  document.getElementById("episodeSection").style.display = "block";
  window.scrollTo({ top: document.getElementById("episodeSection").offsetTop, behavior: "smooth" });
  loadEpisodes(id);
}

function loadEpisodes(id) {
  animeRef.child(id).child("episodes").off();
  animeRef.child(id).child("episodes").on("value", (snap) => {
    const eps = snap.val() || {};
    const list = Object.entries(eps).sort((a,b) => a[1].number - b[1].number);
    const el = document.getElementById("episodeList");
    if (!list.length) { el.innerHTML = '<p class="empty-msg">No episodes yet.</p>'; return; }
    el.innerHTML = `
      <div style="margin-top:20px;">
        <h3 style="color:#d8b4fe;font-size:1rem;margin-bottom:12px;">📺 Episodes (${list.length})</h3>
        ${list.map(([eid, ep]) => {
          const q = [];
          if (ep.q480) q.push('480p');
          if (ep.q720) q.push('720p');
          if (ep.q1080) q.push('1080p');
          if (ep.q4k) q.push('4K');
          if (ep.streaming) q.push('S1');
          if (ep.telegram) q.push('📱');
          if (ep.download) q.push('⬇️');
          return `<div class="admin-list-item">
            <div class="info">
              <strong>EP ${ep.number}: ${ep.title || ''}</strong>
              <small>${q.join(' • ') || 'No links'}</small>
            </div>
            <button class="btn-delete" onclick="deleteEpisode('${eid}')">Del</button>
          </div>`;
        }).join("")}
      </div>`;
  });
}

function addMultiQualityEpisode() {
  if (!currentEditId) { alert("Pehle anime select karein."); return; }
  const num = document.getElementById("mqNumber").value;
  if (!num) { alert("Episode Number zaroori hai!"); return; }
  const q480 = document.getElementById("mq480").value.trim();
  const q720 = document.getElementById("mq720").value.trim();
  const q1080 = document.getElementById("mq1080").value.trim();
  const q4k = document.getElementById("mq4k").value.trim();
  const telegram = document.getElementById("mqTelegram").value.trim();
  if (!q480 && !q720 && !q1080 && !q4k && !telegram) { alert("Kam se kam ek link daalo!"); return; }

  animeRef.child(currentEditId).child("episodes").push({
    number: parseInt(num),
    title: document.getElementById("mqTitle").value.trim(),
    q480, q720, q1080, q4k,
    streaming: q480 || q720 || q1080 || q4k || "",
    streaming2: q720 && q480 ? q720 : "",
    streaming3: q1080 && q480 ? q1080 : "",
    telegram, download: document.getElementById("mqDownload").value.trim(),
    thumb: document.getElementById("mqThumb").value.trim(),
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Episode added!");
    ["mqNumber","mqTitle","mq480","mq720","mq1080","mq4k","mqTelegram","mqDownload","mqThumb"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  });
}

function addSingleEpisode() {
  if (!currentEditId) { alert("Pehle anime select karein."); return; }
  const num = document.getElementById("slNumber").value;
  const link = document.getElementById("slLink").value.trim();
  if (!num) { alert("Episode Number zaroori hai!"); return; }
  if (!link) { alert("Link zaroori hai!"); return; }

  const isTg = link.includes("t.me");
  const isDl = link.includes("download") || link.includes("drive");

  animeRef.child(currentEditId).child("episodes").push({
    number: parseInt(num),
    title: document.getElementById("slTitle").value.trim(),
    telegram: isTg ? link : "",
    download: isDl ? link : "",
    streaming: !isTg && !isDl ? link : "",
    thumb: document.getElementById("slThumb").value.trim(),
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Episode added!");
    ["slNumber","slTitle","slLink","slThumb"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  });
}

function addBatchEpisodes() {
  if (!currentEditId) { alert("Pehle anime select karein."); return; }
  const input = document.getElementById("batchInput").value.trim();
  if (!input) { alert("Data daalo!"); return; }
  const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
  let added = 0;
  lines.forEach((line, idx) => {
    const p = line.split("|").map(x => x.trim());
    if (!p[0]) return;
    animeRef.child(currentEditId).child("episodes").push({
      number: parseInt(p[0]), title: p[5] || "",
      q480: p[1] || "", q720: p[2] || "", q1080: p[3] || "",
      telegram: p[4] || "", streaming: p[1] || "",
      streaming2: p[2] || "", streaming3: p[3] || "",
      createdAt: Date.now() + idx
    }).then(() => { added++; });
  });
  setTimeout(() => {
    showToast(`✅ ${added} episodes added!`);
    document.getElementById("batchInput").value = "";
  }, 1500);
}

function deleteEpisode(eid) {
  if (!confirm("Delete?")) return;
  animeRef.child(currentEditId).child("episodes").child(eid).remove().then(() => showToast("🗑️ Deleted"));
}

function showToast(msg) {
  let t = document.getElementById("toonToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toonToast";
    t.className = "toon-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
  }
