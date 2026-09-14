// ═══════════════════════════════════════════
// ANIME HINDI ZONE - ADMIN PANEL (SEASON SYSTEM FIXED)
// ═══════════════════════════════════════════

const firebaseConfig = {
  databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const animeRef = db.ref("anime");

let allAnime = [];
let currentEditId = null;
let currentSeason = "Season_1";

console.log("🔥 Admin.js started");

// ═══════════════════════════════════════════
// ANILIST API
// ═══════════════════════════════════════════
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
  return (html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

// ═══════════════════════════════════════════
// SEARCH FUNCTION
// ═══════════════════════════════════════════
function searchMAL() {
  const input = document.getElementById("malSearchInput");
  const results = document.getElementById("malResults");
  const loading = document.getElementById("malLoading");

  if (!input || !results) {
    alert("Search box missing! admin.html update karo.");
    return;
  }

  const query = input.value.trim();
  if (!query) {
    results.innerHTML = '<p class="empty-msg">⚠️ Anime ka naam likhein</p>';
    return;
  }

  console.log("🔍 Searching AniList for:", query);
  results.innerHTML = "";
  if (loading) loading.style.display = "block";

  fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      query: ANILIST_QUERY,
      variables: { search: query }
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then(data => {
    if (loading) loading.style.display = "none";
    const list = data?.data?.Page?.media || [];
    console.log("✅ Found:", list.length, "results");
    renderAniListResults(list);
  })
  .catch(err => {
    console.error("❌ AniList error:", err);
    if (loading) loading.style.display = "none";
    results.innerHTML = '<p class="empty-msg">❌ AniList se connect nahi ho paya. 1 minute baad try karo.</p>';
  });
}

// ═══════════════════════════════════════════
// RENDER SEARCH RESULTS
// ═══════════════════════════════════════════
function renderAniListResults(list) {
  const el = document.getElementById("malResults");
  if (!el) return;

  if (!list.length) {
    el.innerHTML = '<p class="empty-msg">❌ Koi match nahi mila. Spelling check karo.</p>';
    return;
  }

  window._anilistResults = list;

  el.innerHTML = `
    <p class="search-hint-text">✅ ${list.length} results — Jo add karna hai uska <strong>Add</strong> click karo</p>
    <div class="anilist-grid">
      ${list.map((m, idx) => {
        const title = m.title.english || m.title.romaji || "Untitled";
        const year = m.startDate?.year || "";
        const rating = m.averageScore ? (m.averageScore / 10).toFixed(1) : "";
        const genre = (m.genres || []).slice(0, 2).join(", ");
        const episodes = m.episodes || "";
        const format = m.format || "TV";
        const poster = m.coverImage?.large || "";

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
              <button 
                class="primary-btn anilist-add-btn" 
                data-index="${idx}"
                onclick="addFromAniListByIndex(${idx}, this)"
              >
                ➕ Add to Library
              </button>
            </div>
          </div>`;
      }).join("")}
    </div>`;
}

function addFromAniListByIndex(idx, btn) {
  console.log("➕ Add clicked for index:", idx);
  const media = window._anilistResults && window._anilistResults[idx];

  if (!media) {
    console.error("❌ No data for index:", idx);
    alert("Error: Anime data nahi mila. Dobara search karo.");
    btn.disabled = false;
    btn.textContent = "➕ Add to Library";
    return;
  }

  addFromAniList(media, btn);
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
  const poster = media.coverImage?.large || "";
  const banner = media.bannerImage || "";
  const format = media.format || "TV";

  const payload = {
    title,
    poster,
    banner,
    year,
    rating,
    genres,
    totalEpisodes: episodes,
    description: desc,
    format,
    anilistId: media.id,
    top10: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  animeRef.push(payload).then(() => {
    console.log("✅ Added:", title);
    btn.textContent = "✅ Added!";
    btn.style.background = "linear-gradient(135deg, #10b981, #059669)";
    showToast(`✅ "${title}" added!`);
  }).catch(err => {
    console.error("❌ Add error:", err);
    btn.disabled = false;
    btn.textContent = "❌ Retry";
    btn.style.background = "";
    alert("Error: " + err.message);
  });
}

// ═══════════════════════════════════════════
// LOAD ALL ANIME
// ═══════════════════════════════════════════
animeRef.on("value", (snap) => {
  const data = snap.val() || {};
  allAnime = Object.entries(data).map(([id, val]) => ({ id, ...val }));
  console.log("📥 Loaded:", allAnime.length, "anime");
  renderAdminList(allAnime);
}, (error) => {
  console.error("❌ Firebase error:", error);
  const el = document.getElementById("adminList");
  if (el) el.innerHTML = '<p class="empty-msg">❌ Error: ' + error.message + '</p>';
});

// ═══════════════════════════════════════════
// RENDER ADMIN LIST
// ═══════════════════════════════════════════
function renderAdminList(list) {
  console.log("📚 Rendering:", list.length, "cards");
  const el = document.getElementById("adminList");
  if (!el) { console.error("❌ adminList missing"); return; }
  if (!list || !list.length) {
    el.innerHTML = '<p class="empty-msg">No anime yet.</p>';
    return;
  }

  el.innerHTML = list.map(a => {
    let epCount = 0;
    if (a.seasons) {
      Object.keys(a.seasons).forEach(sk => {
        if (!sk.startsWith("_")) {
          epCount += Object.keys(a.seasons[sk]).length;
        }
      });
    } else if (a.episodes) {
      epCount = Object.keys(a.episodes).length;
    }
    const title = (a.title || 'Untitled').replace(/'/g, "\\'");
    return `
      <div class="admin-list-item">
        <img src="${a.poster||''}" onerror="this.src='https://via.placeholder.com/50x65'">
        <div class="info">
          <strong>${a.title||'Untitled'}</strong>
          <small>${a.year||''} ${a.rating?'⭐'+a.rating:''} • ${epCount} eps</small>
        </div>
        <button class="btn-edit" onclick="editAnime('${a.id}')">Edit</button>
        <button class="btn-episodes" onclick="openEpisodes('${a.id}','${title}')">Eps</button>
        <button class="btn-delete" onclick="deleteAnime('${a.id}','${title}')">Del</button>
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
    title,
    poster,
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
    animeRef.child(currentEditId).update(anime).then(() => {
      alert("✅ Updated!");
      resetAnimeForm();
    });
  } else {
    anime.createdAt = Date.now();
    animeRef.push(anime).then(() => {
      alert("✅ Anime added!");
      resetAnimeForm();
    });
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

// ═══ ADMIN SEARCH ═══
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

// ═══════════════════════════════════════════
// SEASON SYSTEM — OPEN EPISODES
// ═══════════════════════════════════════════
function openEpisodes(id, title) {
  currentEditId = id;
  document.getElementById("currentAnimeName").textContent = title;
  document.getElementById("episodeSection").style.display = "block";
  window.scrollTo({ top: document.getElementById("episodeSection").offsetTop, behavior: "smooth" });
  loadSeasons(id);
}

// ═══════════════════════════════════════════
// LOAD SEASONS — FIXED VERSION
// ═══════════════════════════════════════════
function loadSeasons(animeId) {
  animeRef.child(animeId).once("value").then(snap => {
    const anime = snap.val() || {};
    const seasons = anime.seasons || {};
    const legacyEpisodes = anime.episodes || null;

    // ═══ Filter out metadata fields (_created, _name) ═══
    const seasonKeys = Object.keys(seasons)
      .filter(k => !k.startsWith("_"))
      .sort((x, y) => {
        const nx = parseInt(x.replace(/\D/g, "")) || 0;
        const ny = parseInt(y.replace(/\D/g, "")) || 0;
        return nx - ny;
      });

    // ═══ Render Season Selector ═══
    const seasonSelector = document.getElementById("seasonSelector");
    if (seasonSelector) {
      let tabsHTML = "";
      
      if (seasonKeys.length === 0 && !legacyEpisodes) {
        tabsHTML = `<p style="color:#94a3b8;font-size:0.82rem;padding:8px;width:100%;">📺 Abhi koi season nahi hai. <strong>New Season</strong> button se banao.</p>`;
      } else {
        // ═══ Legacy episodes ko Season 1 me show karo ═══
        if (legacyEpisodes && !seasonKeys.includes("Season_1")) {
          tabsHTML += `
            <button class="season-selector-tab ${currentSeason === 'Season_1' ? 'active' : ''}" 
                    onclick="selectSeason('${animeId}','Season_1')">
              Season 1 (Purana)
            </button>
          `;
        }
        
        tabsHTML += seasonKeys.map(sk => `
          <button class="season-selector-tab ${sk === currentSeason ? 'active' : ''}" 
                  onclick="selectSeason('${animeId}','${sk}')">
            ${sk.replace(/_/g, " ")}
          </button>
        `).join("");
      }
      
      tabsHTML += `
        <button class="season-selector-tab new-season-btn" onclick="createNewSeason('${animeId}')">
          ➕ New Season
        </button>
      `;

      seasonSelector.innerHTML = `
        <label style="font-size:0.75rem;color:#67e8f9;font-weight:700;margin-bottom:8px;display:block;">📺 Season Select Karo:</label>
        <div class="season-selector-tabs">${tabsHTML}</div>
      `;
    }

    // ═══ Load episodes for selected season ═══
    if (seasonKeys.length === 0 && !legacyEpisodes) {
      // Koi season nahi aur koi legacy episodes nahi
      currentSeason = null;
      const el = document.getElementById("episodeList");
      if (el) el.innerHTML = '<p class="empty-msg" style="text-align:center;padding:20px;">📺 Abhi koi season nahi hai. Upar <strong>➕ New Season</strong> button se season banao.</p>';
    } else if (legacyEpisodes && (currentSeason === "Season_1" || !currentSeason)) {
      // Legacy episodes show karo
      currentSeason = "Season_1";
      loadLegacyEpisodes(animeId, legacyEpisodes);
    } else {
      // Season select logic
      if (!currentSeason || (!seasonKeys.includes(currentSeason) && currentSeason !== "Season_1")) {
        currentSeason = seasonKeys[0];
      }
      loadEpisodesForSeason(animeId, currentSeason);
    }
  });
}

// ═══ LOAD LEGACY EPISODES (PURANE) ═══
function loadLegacyEpisodes(animeId, episodes) {
  const list = Object.entries(episodes).sort((a,b) => a[1].number - b[1].number);
  const el = document.getElementById("episodeList");
  if (!el) return;

  if (!list.length) {
    el.innerHTML = '<p class="empty-msg">Is season me abhi koi episode nahi hai.</p>';
    return;
  }

  el.innerHTML = `
    <div style="margin-top:20px;">
      <h3 style="color:#67e8f9;font-size:1rem;margin-bottom:12px;">
        📺 Season 1 (Purane Episodes) — ${list.length} Episodes
      </h3>
      <p style="font-size:0.75rem;color:#fbbf24;margin-bottom:12px;padding:8px;background:rgba(251,191,36,0.1);border-radius:8px;border:1px solid rgba(251,191,36,0.3);">
        ⚠️ Ye purane format me hain. Convert karne ke liye <strong>Migrate</strong> karo.
      </p>
      <button class="primary-btn" style="max-width:200px;margin-bottom:12px;" onclick="migrateToSeasons('${animeId}')">
        🔄 Migrate to Season 1
      </button>
      ${list.map(([eid, ep]) => {
        const qualities = [];
        if (ep.q480) qualities.push('480p');
        if (ep.q720) qualities.push('720p');
        if (ep.q1080) qualities.push('1080p');
        if (ep.q4k) qualities.push('4K');
        if (ep.telegram) qualities.push('📱');
        if (ep.download) qualities.push('⬇️');
        if (ep.streaming) qualities.push('S1');
        return `
          <div class="admin-list-item">
            <div class="info">
              <strong>EP ${ep.number}: ${ep.title || ''}</strong>
              <small>${qualities.join(' • ') || 'No links'}</small>
            </div>
            <button class="btn-delete" onclick="deleteLegacyEpisode('${animeId}','${eid}')">Del</button>
          </div>`;
      }).join("")}
    </div>`;
}

// ═══ DELETE LEGACY EPISODE ═══
window.deleteLegacyEpisode = function(animeId, eid) {
  if (!confirm("Episode delete karein?")) return;
  animeRef.child(animeId).child("episodes").child(eid).remove().then(() => {
    showToast("🗑️ Episode deleted");
    loadSeasons(animeId);
  });
};

// ═══ SELECT SEASON ═══
window.selectSeason = function(animeId, seasonName) {
  currentSeason = seasonName;
  console.log("📺 Season switched:", seasonName);
  loadSeasons(animeId);
};

// ═══════════════════════════════════════════
// CREATE NEW SEASON — FIXED (Purana Safe Rahega)
// ═══════════════════════════════════════════
window.createNewSeason = function(animeId) {
  const name = prompt("Naye season ka naam likho:", "Season 2");
  if (!name) return;

  const cleanName = name.trim().replace(/\s+/g, "_");

  // ═══ Check: Season already exists? ═══
  animeRef.child(animeId).child("seasons").child(cleanName).once("value").then(snap => {
    if (snap.exists()) {
      const confirm = window.confirm(`Season "${name}" already exists. Isme episodes add karo?`);
      if (confirm) {
        currentSeason = cleanName;
        loadSeasons(animeId);
      }
      return;
    }

    // ═══ Naya season create karo — Purana SAFE rahega ═══
    animeRef.child(animeId).child("seasons").child(cleanName).set({
      _created: Date.now(),
      _name: name.trim()
    }).then(() => {
      showToast("✅ Season banaya: " + name);
      currentSeason = cleanName;
      loadSeasons(animeId);
    }).catch(err => {
      console.error("❌ Season create error:", err);
      alert("❌ Error: " + err.message);
    });
  });
};

// ═══════════════════════════════════════════
// LOAD EPISODES FOR SEASON
// ═══════════════════════════════════════════
function loadEpisodesForSeason(animeId, seasonName) {
  animeRef.child(animeId).child("seasons").child(seasonName).off();
  animeRef.child(animeId).child("seasons").child(seasonName).on("value", snap => {
    const data = snap.val() || {};
    
    // ═══ Filter out metadata fields ═══
    const eps = Object.entries(data).filter(([k, v]) => !k.startsWith("_"));
    const list = eps.sort((a,b) => a[1].number - b[1].number);
    
    const el = document.getElementById("episodeList");
    if (!el) return;

    if (!list.length) {
      el.innerHTML = `<p class="empty-msg" style="text-align:center;padding:20px;">Is season (${seasonName.replace(/_/g," ")}) me abhi koi episode nahi hai. Upar form se add karo.</p>`;
      return;
    }

    el.innerHTML = `
      <div style="margin-top:20px;">
        <h3 style="color:#67e8f9;font-size:1rem;margin-bottom:12px;">
          📺 ${seasonName.replace(/_/g," ")} — ${list.length} Episodes
        </h3>
        ${list.map(([eid, ep]) => {
          const qualities = [];
          if (ep.q480) qualities.push('480p');
          if (ep.q720) qualities.push('720p');
          if (ep.q1080) qualities.push('1080p');
          if (ep.q4k) qualities.push('4K');
          if (ep.telegram) qualities.push('📱');
          if (ep.download) qualities.push('⬇️');
          return `
            <div class="admin-list-item">
              <div class="info">
                <strong>EP ${ep.number}: ${ep.title || ''}</strong>
                <small>${qualities.join(' • ') || 'No links'}</small>
              </div>
              <button class="btn-delete" onclick="deleteSeasonEpisode('${animeId}','${seasonName}','${eid}')">Del</button>
            </div>`;
        }).join("")}
      </div>`;
  });
}

// ═══ ADD MULTI-QUALITY (SEASON-WISE) ═══
function addMultiQualityEpisode() {
  if (!currentEditId) { alert("Pehle anime select karein."); return; }
  if (!currentSeason) { alert("Pehle season select karo."); return; }

  const num = document.getElementById("mqNumber").value;
  const title = document.getElementById("mqTitle").value.trim();
  const q480 = document.getElementById("mq480").value.trim();
  const q720 = document.getElementById("mq720").value.trim();
  const q1080 = document.getElementById("mq1080").value.trim();
  const q4k = document.getElementById("mq4k").value.trim();
  const telegram = document.getElementById("mqTelegram").value.trim();
  const download = document.getElementById("mqDownload").value.trim();
  const thumb = document.getElementById("mqThumb").value.trim();

  if (!num) { alert("Episode Number zaroori hai!"); return; }
  if (!q480 && !q720 && !q1080 && !q4k && !telegram) {
    alert("Kam se kam ek link daalo!");
    return;
  }

  const payload = {
    number: parseInt(num),
    title: title,
    q480: q480,
    q720: q720,
    q1080: q1080,
    q4k: q4k,
    streaming: q480 || q720 || q1080 || q4k || "",
    streaming2: q720 && q480 ? q720 : "",
    streaming3: q1080 && q480 ? q1080 : "",
    telegram: telegram,
    download: download,
    thumb: thumb,
    createdAt: Date.now()
  };

  animeRef.child(currentEditId).child("seasons").child(currentSeason).push(payload).then(() => {
    showToast("✅ Episode added to " + currentSeason.replace(/_/g, " ") + "!");
    ["mqNumber","mqTitle","mq480","mq720","mq1080","mq4k","mqTelegram","mqDownload","mqThumb"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }).catch(e => alert("❌ Error: " + e.message));
}

// ═══ SINGLE EPISODE (SEASON-WISE) ═══
function addSingleEpisode() {
  if (!currentEditId) { alert("Pehle anime select karein."); return; }
  if (!currentSeason) { alert("Pehle season select karo."); return; }

  const num = document.getElementById("slNumber").value;
  const title = document.getElementById("slTitle").value.trim();
  const link = document.getElementById("slLink").value.trim();
  const thumb = document.getElementById("slThumb").value.trim();

  if (!num) { alert("Episode Number zaroori hai!"); return; }
  if (!link) { alert("Link zaroori hai!"); return; }

  const isTelegram = link.includes("t.me");
  const isDownload = link.includes("download") || link.includes("drive");

  const payload = {
    number: parseInt(num),
    title: title,
    telegram: isTelegram ? link : "",
    download: isDownload ? link : "",
    streaming: !isTelegram && !isDownload ? link : "",
    thumb: thumb,
    createdAt: Date.now()
  };

  animeRef.child(currentEditId).child("seasons").child(currentSeason).push(payload).then(() => {
    showToast("✅ Episode added to " + currentSeason.replace(/_/g, " ") + "!");
    ["slNumber","slTitle","slLink","slThumb"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  });
}

// ═══ BATCH EPISODE (SEASON-WISE) ═══
function addBatchEpisodes() {
  if (!currentEditId) { alert("Pehle anime select karein."); return; }
  if (!currentSeason) { alert("Pehle season select karo."); return; }

  const input = document.getElementById("batchInput").value.trim();
  if (!input) { alert("Episodes data daalo!"); return; }

  const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.length) { alert("Koi valid line nahi mili!"); return; }

  let added = 0;
  let errors = 0;

  lines.forEach((line, idx) => {
    const parts = line.split("|").map(p => p.trim());
    const num = parts[0];
    if (!num) { errors++; return; }

    const payload = {
      number: parseInt(num),
      title: parts[5] || "",
      q480: parts[1] || "",
      q720: parts[2] || "",
      q1080: parts[3] || "",
      telegram: parts[4] || "",
      streaming: parts[1] || "",
      streaming2: parts[2] || "",
      streaming3: parts[3] || "",
      createdAt: Date.now() + idx
    };

    animeRef.child(currentEditId).child("seasons").child(currentSeason).push(payload)
      .then(() => { added++; })
      .catch(() => { errors++; });
  });

  setTimeout(() => {
    showToast(`✅ ${added} episodes added to ${currentSeason.replace(/_/g, " ")}! ${errors ? `(${errors} failed)` : ""}`);
    document.getElementById("batchInput").value = "";
  }, 1500);
}

// ═══ DELETE EPISODE ═══
window.deleteSeasonEpisode = function(animeId, seasonName, eid) {
  if (!confirm("Episode delete karein?")) return;
  animeRef.child(animeId).child("seasons").child(seasonName).child(eid).remove().then(() => {
    showToast("🗑️ Episode deleted");
  });
};

// ═══ MIGRATION: Purane episodes → Season_1 ═══
window.migrateToSeasons = function(animeId) {
  if (!confirm("Purane episodes ko Season_1 me convert karein?\n\n⚠️ Purane episodes Season_1 me move ho jayenge.")) return;
  
  animeRef.child(animeId).once("value").then(snap => {
    const anime = snap.val() || {};
    if (!anime.episodes) { alert("Koi purane episodes nahi mile."); return; }

    // ═══ Season_1 me existing data check karo ═══
    const existingSeason1 = anime.seasons?.Season_1 || {};
    const existingEps = Object.keys(existingSeason1).filter(k => !k.startsWith("_"));
    
    if (existingEps.length > 0) {
      if (!confirm(`Season 1 me already ${existingEps.length} episodes hain. Purane episodes merge karein?`)) return;
    }

    // ═══ Merge karo ═══
    const mergedData = {
      ...existingSeason1,
      ...anime.episodes
    };

    animeRef.child(animeId).child("seasons").child("Season_1").set(mergedData).then(() => {
      animeRef.child(animeId).child("episodes").remove();
      showToast("✅ Purane episodes Season 1 me migrate ho gaye!");
      currentSeason = "Season_1";
      loadSeasons(animeId);
    }).catch(err => {
      console.error("Migration error:", err);
      alert("❌ Migration error: " + err.message);
    });
  });
};

// ═══ TOAST ═══
function showToast(msg) {
  let toast = document.getElementById("toonToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toonToast";
    toast.className = "toon-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

console.log("✅ Admin.js loaded (SEASON SYSTEM FIXED)");
