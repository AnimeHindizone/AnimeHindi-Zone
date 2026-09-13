// ═══════════════════════════════════════════
// ANIME HINDI ZONE - MAIN SCRIPT
// ═══════════════════════════════════════════

(function() {
  try {
    console.log("🔥 Anime Hindi Zone script started");

    const firebaseConfig = {
      databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/"
    };

    if (typeof firebase === "undefined") { console.error("❌ Firebase not loaded"); return; }
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);

    const db = firebase.database();
    const animeRef = db.ref("anime");

    let allAnime = [];
    let currentGenre = "All";
    let currentFilters = { genre: "All", year: "All", rating: "All", format: "All" };

    function getGenres(a) { return (a.genres || a.genres2 || "Anime").toString(); }
    function getYear(a) {
      if (!a.year) return "";
      const m = String(a.year).match(/\d{4}/);
      return m ? m[0] : a.year;
    }
    function esc(s) { return String(s || "").replace(/'/g, "\\'"); }
    function safeId(id) { return encodeURIComponent(String(id)); }

    window.goToAnime = function(id) {
      window.location.href = "anime.html?id=" + encodeURIComponent(id);
    };

    function cardHTML(anime, showNew, rank) {
      const poster = anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
      const isNew = showNew && (Date.now() - (anime.createdAt||0) < 7*24*60*60*1000);
      const year = getYear(anime);
      const genre = getGenres(anime).split(",")[0].trim();
      const isFav = window.ToonFav && ToonFav.isFav(anime.id);
      const sid = safeId(anime.id);

      return `
        <div class="anime-card ${rank?'top10-card':''}" data-id="${sid}">
          ${anime.rating ? `<span class="rating-badge">⭐ ${anime.rating}</span>` : ''}
          ${isNew ? '<span class="badge-new">NEW</span>' : ''}
          ${rank ? `<span class="top10-rank">${rank}</span>` : ''}
          <button class="heart-btn ${isFav?'active':''}" onclick="event.stopPropagation();toggleFavCard(this,'${sid}')">${isFav ? '❤️' : '🤍'}</button>
          <img src="${poster}" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'" alt="">
          <div class="card-info">
            <h3>${anime.title || "Untitled"}</h3>
            <p>${year} ${genre ? "• " + genre : ""}</p>
          </div>
        </div>`;
    }

    function attachCardClickHandlers() {
      document.querySelectorAll(".anime-card").forEach(card => {
        if (card.dataset.clickAttached === "true") return;
        card.dataset.clickAttached = "true";
        card.addEventListener("click", function(e) {
          if (e.target.closest(".heart-btn")) return;
          const id = this.dataset.id;
          if (id) window.goToAnime(decodeURIComponent(id));
        });
      });
    }

    window.toggleFavCard = function(btn, encodedId) {
      const animeId = decodeURIComponent(encodedId);
      const anime = allAnime.find(a => a.id === animeId);
      if (!anime) return;
      const added = ToonFav.toggle(anime);
      btn.classList.toggle("active", added);
      btn.textContent = added ? "❤️" : "🤍";
      showToast(added ? "❤️ Favorites me add kiya!" : "Removed");
    };

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
      setTimeout(() => toast.classList.remove("show"), 2000);
    }
    window.showToast = showToast;

    function renderHero(list) {
      const el = document.getElementById("heroSlider");
      if (!el) return;
      if (!list.length) { const hs = document.getElementById("heroSection"); if (hs) hs.style.display = "none"; return; }
      el.innerHTML = list.map(a => {
        const sid = safeId(a.id);
        return `
        <div class="hero-card" data-id="${sid}">
          <img src="${a.banner || a.poster || ''}" onerror="this.src='https://via.placeholder.com/800x400'">
          <div class="hero-overlay">
            <span class="hero-tag">🔥 TRENDING</span>
            <h3>${a.title || ''}</h3>
            <p>
              ${getYear(a) ? `<span>📅 ${getYear(a)}</span>` : ''}
              ${a.rating ? `<span>⭐ ${a.rating}</span>` : ''}
            </p>
            <span class="hero-play">▶ Watch Now</span>
          </div>
        </div>
      `}).join("");
      el.querySelectorAll(".hero-card").forEach(card => {
        card.addEventListener("click", function() {
          const id = this.dataset.id;
          if (id) window.goToAnime(decodeURIComponent(id));
        });
      });
    }

    function renderNewlyUpdated(list) {
      const el = document.getElementById("newlyUpdated");
      if (!el) return;
      if (!list.length) { el.innerHTML = '<p class="empty-msg" style="flex:0 0 100%">No anime yet.</p>'; return; }
      el.innerHTML = list.map(a => cardHTML(a, true, null)).join("");
      attachCardClickHandlers();
    }

    function renderTop10(list) {
      const el = document.getElementById("top10Grid");
      if (!el) return;
      const sorted = [...list].sort((a,b) => (parseFloat(b.rating)||0) - (parseFloat(a.rating)||0)).slice(0,10);
      if (!sorted.length) { el.innerHTML = '<p class="empty-msg" style="flex:0 0 100%">No Top 10 yet.</p>'; return; }
      el.innerHTML = sorted.map((a,i) => cardHTML(a, false, i+1)).join("");
      attachCardClickHandlers();
    }

    function renderGenres() {
      const el = document.getElementById("genreBtns");
      if (!el) return;
      const set = new Set();
      allAnime.forEach(a => {
        getGenres(a).split(",").forEach(x => { const t = x.trim(); if (t) set.add(t); });
      });
      const genres = ["All", ...Array.from(set).sort()];
      el.innerHTML = genres.map(g => `<button class="chip ${g===currentGenre?'active':''}" onclick="filterGenre('${esc(g)}', this)">${g}</button>`).join("");
    }

    function renderAllAnime(list) {
      const el = document.getElementById("allAnime");
      if (!el) return;
      if (!list.length) { el.innerHTML = '<p class="empty-msg">No anime found.</p>'; return; }
      el.innerHTML = list.map(a => cardHTML(a, false, null)).join("");
      attachCardClickHandlers();
    }

    window.filterGenre = function(g, btn) {
      currentGenre = g;
      currentFilters.genre = g;
      document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      if (btn) btn.classList.add("active");
      applyFilters();
    };

    function applyFilters() {
      let list = [...allAnime];
      const f = currentFilters;
      if (f.genre !== "All") list = list.filter(a => getGenres(a).includes(f.genre));
      if (f.year !== "All") list = list.filter(a => getYear(a) === f.year);
      if (f.rating !== "All") list = list.filter(a => (parseFloat(a.rating)||0) >= parseFloat(f.rating));
      if (f.format !== "All") list = list.filter(a => (a.format||"TV").toUpperCase() === f.format);
      renderAllAnime(list);
    }

    window.applyAdvancedFilter = function() {
      currentFilters.year = document.getElementById("filterYear").value;
      currentFilters.rating = document.getElementById("filterRating").value;
      currentFilters.format = document.getElementById("filterFormat").value;
      applyFilters();
      showToast("✅ Filters applied");
    };

    window.resetAdvancedFilter = function() {
      document.getElementById("filterYear").value = "All";
      document.getElementById("filterRating").value = "All";
      document.getElementById("filterFormat").value = "All";
      currentFilters = { genre: currentGenre, year: "All", rating: "All", format: "All" };
      applyFilters();
      showToast("Reset");
    };

    window.toggleFilterPanel = function() {
      const p = document.getElementById("filterPanel");
      if (p) p.classList.toggle("open");
    };

    window.doSearch = function() {
      const q = document.getElementById("searchInput").value.trim().toLowerCase();
      if (!q) { applyFilters(); return; }
      const filtered = allAnime.filter(a => (a.title||"").toLowerCase().includes(q));
      renderAllAnime(filtered);
      const el = document.getElementById("all");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    if (document.getElementById("allAnime")) {
      animeRef.on("value", (snapshot) => {
        const data = snapshot.val() || {};
        allAnime = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        const sorted = [...allAnime].sort((a,b) => (b.updatedAt||b.createdAt||0) - (a.updatedAt||a.createdAt||0));
        renderHero(sorted.slice(0, 5));
        renderNewlyUpdated(sorted.slice(0, 12));
        renderTop10(allAnime.filter(a => a.top10));
        renderGenres();
        renderAllAnime(allAnime);
        const years = [...new Set(allAnime.map(a => getYear(a)).filter(Boolean))].sort().reverse();
        const yearSel = document.getElementById("filterYear");
        if (yearSel) yearSel.innerHTML = '<option value="All">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join("");
      });
      const sb = document.getElementById("searchBtn");
      const si = document.getElementById("searchInput");
      if (sb) sb.addEventListener("click", window.doSearch);
      if (si) si.addEventListener("keyup", (e) => { if (e.key === "Enter") window.doSearch(); });
    }

    window.renderContinueWatching = function() {
      const section = document.getElementById("continueWatchingSection");
      const el = document.getElementById("continueWatching");
      if (!section || !el) return;
      try {
        const history = JSON.parse(localStorage.getItem("toonflix_history") || "[]");
        if (!history.length) { section.style.display = "none"; return; }
        section.style.display = "block";
        el.innerHTML = history.slice(0, 10).map(h => {
          const sid = safeId(h.animeId);
          return `<div class="anime-card" data-id="${sid}"><img src="${h.poster || 'https://via.placeholder.com/300x400'}"><div class="card-info"><h3>${h.title}</h3><p>EP ${h.epNumber}</p></div></div>`;
        }).join("");
        attachCardClickHandlers();
      } catch (e) {}
    };
    if (document.getElementById("continueWatching")) {
      window.renderContinueWatching();
      setInterval(window.renderContinueWatching, 3000);
    }

    window.loadAnimeDetail = function() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const el = document.getElementById("detailContainer");
      if (!id || !el) return;

      animeRef.child(id).on("value", (snap) => {
        const a = snap.val();
        if (!a) { el.innerHTML = "<p class='empty-msg'>Anime not found.</p>"; return; }
        const banner = a.banner || a.poster || "";
        const poster = a.poster || "https://via.placeholder.com/300x400";
        const year = getYear(a);
        const genreList = getGenres(a).split(",").map(g => g.trim()).filter(Boolean);
        const isFav = ToonFav.isFav(id);
        const userRating = ToonRating.get(id);

        let episodesHTML = "";
        if (a.episodes) {
          const eps = Object.entries(a.episodes).sort((x,y) => x[1].number - y[1].number);
          episodesHTML = eps.map(([eid, ep]) => {
            const buttons = [];
            if (ep.telegram) buttons.push(`<a href="${ep.telegram}" target="_blank" rel="noopener" class="ep-action-btn tg">📱 Telegram</a>`);
            if (ep.streaming || ep.streaming2 || ep.streaming3 || ep.link || ep.q480 || ep.q720 || ep.q1080) {
              buttons.push(`<a href="watch.html?anime=${encodeURIComponent(id)}&ep=${ep.number}" class="ep-action-btn stream">🎬 Watch Online</a>`);
            }
            if (ep.download) buttons.push(`<a href="${ep.download}" target="_blank" rel="noopener" class="ep-action-btn dl">⬇️ Download</a>`);
            const btnHTML = buttons.length ? `<div class="ep-actions">${buttons.join("")}</div>` : '<p class="ep-no-link">⚠️ Koi link nahi</p>';
            return `<div class="episode-card"><div class="ep-header"><strong>EP ${ep.number}</strong>${ep.title ? `<span>${ep.title}</span>` : ''}</div>${btnHTML}</div>`;
          }).join("");
        } else { episodesHTML = "<p class='empty-msg'>No episodes yet.</p>"; }

        el.innerHTML = `
          ${banner ? `<img class="detail-banner" src="${banner}" onerror="this.style.display='none'">` : ""}
          <div class="detail-header">
            <img class="detail-poster" src="${poster}" onerror="this.src='https://via.placeholder.com/300x400'">
            <div class="detail-info">
              <h1>${a.title || "Untitled"}</h1>
              <div class="detail-meta">
                ${year ? `<span class="meta-tag">📅 ${year}</span>` : ""}
                ${a.rating ? `<span class="meta-tag">⭐ ${a.rating}</span>` : ""}
                ${a.episodes ? `<span class="meta-tag">🎬 ${Object.keys(a.episodes).length} Episodes</span>` : ""}
                ${genreList.map(g => `<span class="meta-tag">${g}</span>`).join("")}
              </div>
              <div class="detail-actions">
                <button class="detail-btn fav ${isFav?'active':''}" onclick="toggleFavDetail('${esc(id)}')">${isFav ? '❤️ Saved' : '🤍 Add to Favorites'}</button>
                <button class="detail-btn share" onclick="shareAnime('${esc(a.title)}','${esc(id)}')">📤 Share</button>
              </div>
              <p class="detail-desc">${a.description || "No description."}</p>
            </div>
          </div>
          <div class="rating-section">
            <h3>⭐ Rate this anime</h3>
            <div class="star-rating">${[1,2,3,4,5].map(i => `<button class="star ${userRating >= i ? 'active' : ''}" onclick="setRating('${esc(id)}',${i})">★</button>`).join("")}</div>
            <p class="rating-text">${userRating ? `Aapne ${userRating} star diya` : "Abhi tak rating nahi di"}</p>
          </div>
          <div class="episodes-section">
            <h2>📺 Episodes</h2>
            <div class="episode-grid-new">${episodesHTML}</div>
          </div>
          <div class="comments-section">
            <h2>💬 Comments</h2>
            <div class="comment-form">
              <input id="commentName" placeholder="Aapka naam..." value="${ToonUser.get() ? ToonUser.get().name : ''}" maxlength="30">
              <textarea id="commentText" placeholder="Comment likhein..." maxlength="500"></textarea>
              <button class="comment-post-btn" onclick="postComment('${esc(id)}')">📩 Post Comment</button>
            </div>
            <div class="comments-list" id="commentsList"><p class="empty-msg">Loading...</p></div>
          </div>`;
        loadComments(id);
      });
    };

    window.toggleFavDetail = function(id) {
      animeRef.child(id).once("value").then(s => {
        const data = { id, ...s.val() };
        const added = ToonFav.toggle(data);
        const btn = document.querySelector(".detail-btn.fav");
        if (btn) { btn.classList.toggle("active", added); btn.innerHTML = added ? "❤️ Saved" : "🤍 Add to Favorites"; }
        showToast(added ? "❤️ Added!" : "Removed");
      });
    };

    window.setRating = function(animeId, rating) {
      ToonRating.set(animeId, rating);
      document.querySelectorAll(".star").forEach((s, i) => s.classList.toggle("active", i < rating));
      const txt = document.querySelector(".rating-text");
      if (txt) txt.textContent = `Aapne ${rating} star diya`;
      showToast(`⭐ ${rating} star diya!`);
    };

    window.postComment = function(animeId) {
      const name = document.getElementById("commentName").value.trim() || "Anonymous";
      const text = document.getElementById("commentText").value.trim();
      if (!text) { alert("Comment likho!"); return; }
      const user = ToonUser.get();
      if (!user) ToonUser.set(name, "");
      db.ref("comments/" + animeId).push({ name, text, time: Date.now() }).then(() => {
        document.getElementById("commentText").value = "";
        showToast("✅ Comment posted!");
        loadComments(animeId);
      });
    };

    function loadComments(animeId) {
      const el = document.getElementById("commentsList");
      if (!el) return;
      db.ref("comments/" + animeId).limitToLast(50).on("value", (snap) => {
        const data = snap.val() || {};
        const list = Object.entries(data).map(([k,v]) => ({...v, key:k})).sort((a,b) => b.time - a.time);
        if (!list.length) { el.innerHTML = '<p class="empty-msg">Abhi koi comment nahi.</p>'; return; }
        el.innerHTML = list.map(c => `<div class="comment-item"><div class="comment-header"><strong>${c.name}</strong><small>${timeAgo(c.time)}</small></div><p>${c.text}</p></div>`).join("");
      });
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

    window.shareAnime = function(title, id) {
      const url = window.location.origin + window.location.pathname.replace(/anime\.html.*/, `anime.html?id=${id}`);
      if (navigator.share) navigator.share({ title, text: `Dekho: ${title}`, url });
      else navigator.clipboard.writeText(url).then(() => showToast("📋 Link copy!"));
    };

    if (document.getElementById("detailContainer")) window.loadAnimeDetail();
    console.log("✅ Anime Hindi Zone script loaded");
  } catch (e) { console.error("❌ script.js error:", e); }
})();
