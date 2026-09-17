// ═══════════════════════════════════════════
// ANIME HINDI ZONE - ANALYTICS TRACKING
// Cyberpunk Edition
// ═══════════════════════════════════════════

(function() {
  try {
    const firebaseConfig = {
      databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/"
    };

    if (typeof firebase === "undefined") return;
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);

    const adb = firebase.database();
    const analyticsRef = adb.ref("analytics");

    // ═══ HELPERS ═══
    function getVisitorId() {
      let vid = localStorage.getItem("toonflix_visitor_id");
      if (!vid) {
        vid = "v_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("toonflix_visitor_id", vid);
      }
      return vid;
    }

    function getSessionId() {
      let sid = sessionStorage.getItem("toonflix_session_id");
      if (!sid) {
        sid = "s_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem("toonflix_session_id", sid);
        sessionStorage.setItem("toonflix_session_start", Date.now().toString());
      }
      return sid;
    }

    function getDeviceType() {
      const ua = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
      if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "Mobile";
      return "Desktop";
    }

    function getBrowser() {
      const ua = navigator.userAgent;
      if (ua.includes("Edg/")) return "Edge";
      if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
      if (ua.includes("Chrome/") && !ua.includes("Edg")) return "Chrome";
      if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
      if (ua.includes("Firefox/")) return "Firefox";
      return "Other";
    }

    function getScreenSize() {
      const w = window.screen.width;
      if (w < 480) return "Small Phone";
      if (w < 768) return "Phone";
      if (w < 1024) return "Tablet";
      if (w < 1440) return "Desktop";
      return "Large Desktop";
    }

    function getReferrer() {
      const ref = document.referrer;
      if (!ref) return "Direct";
      if (ref.includes("google.")) return "Google";
      if (ref.includes("youtube.") || ref.includes("youtu.be")) return "YouTube";
      if (ref.includes("t.me") || ref.includes("telegram.")) return "Telegram";
      if (ref.includes("facebook.") || ref.includes("fb.")) return "Facebook";
      if (ref.includes("instagram.")) return "Instagram";
      if (ref.includes("twitter.") || ref.includes("x.com")) return "Twitter";
      if (ref.includes("whatsapp.")) return "WhatsApp";
      if (ref.includes("reddit.")) return "Reddit";
      if (ref.includes(window.location.hostname)) return "Internal";
      return "Other";
    }

    function getTodayKey() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }

    function getHourKey() {
      return String(new Date().getHours()).padStart(2, "0");
    }

    // ═══ TRACK PAGE VIEW ═══
    function trackPageView(pageName) {
      try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        const device = getDeviceType();
        const browser = getBrowser();
        const screenSize = getScreenSize();
        const referrer = getReferrer();
        const today = getTodayKey();
        const hour = getHourKey();
        const ts = Date.now();

        analyticsRef.child("daily").child(today).child("visitors").child(visitorId).set(ts);
        analyticsRef.child("daily").child(today).child("pageviews").transaction(c => (c || 0) + 1);
        analyticsRef.child("total").child("pageviews").transaction(c => (c || 0) + 1);

        analyticsRef.child("users").child(visitorId).update({
          lastSeen: ts,
          device,
          browser,
          screenSize,
          referrer,
          country: (navigator.language || "en").split("-")[1] || "Unknown"
        });

        analyticsRef.child("pages").child(pageName).transaction(c => (c || 0) + 1);
        analyticsRef.child("devices").child(device).transaction(c => (c || 0) + 1);
        analyticsRef.child("browsers").child(browser).transaction(c => (c || 0) + 1);
        analyticsRef.child("screens").child(screenSize).transaction(c => (c || 0) + 1);
        analyticsRef.child("referrers").child(referrer).transaction(c => (c || 0) + 1);
        analyticsRef.child("hours").child(hour).transaction(c => (c || 0) + 1);

        analyticsRef.child("recent").push({
          visitorId: visitorId.substr(0, 12) + "...",
          page: pageName,
          device,
          browser,
          referrer,
          time: ts
        });

        analyticsRef.child("recent").once("value").then(snap => {
          const items = snap.val() || {};
          const keys = Object.keys(items);
          if (keys.length > 50) {
            const sorted = keys.sort((a, b) => (items[a].time || 0) - (items[b].time || 0));
            sorted.slice(0, keys.length - 50).forEach(k => analyticsRef.child("recent").child(k).remove());
          }
        });
      } catch (e) {}
    }

    // ═══ TRACK EPISODE PLAY ═══
    window.trackEpisodePlay = function(animeId, animeTitle, epNum) {
      try {
        const today = getTodayKey();
        const hour = getHourKey();
        const ts = Date.now();

        analyticsRef.child("episodes").child(animeId).child("plays").transaction(c => (c || 0) + 1);
        analyticsRef.child("episodes").child(animeId).update({
          title: animeTitle,
          lastPlayed: ts
        });

        analyticsRef.child("daily").child(today).child("episodePlays").transaction(c => (c || 0) + 1);
        analyticsRef.child("episodes").child(animeId).child("eps").child(epNum).transaction(c => (c || 0) + 1);

        const epKey = animeId + "_" + epNum;
        analyticsRef.child("topEpisodes").child(epKey).transaction(current => {
          if (!current) {
            return { animeId, title: animeTitle, epNum, plays: 1, lastPlayed: ts };
          }
          current.plays = (current.plays || 0) + 1;
          current.lastPlayed = ts;
          current.title = animeTitle;
          return current;
        });

        analyticsRef.child("hours").child(hour).transaction(c => (c || 0) + 1);
      } catch (e) {}
    };

    // ═══ AUTO-TRACK ON PAGE LOAD ═══
    setTimeout(() => {
      const path = window.location.pathname;
      let pageName = "home";
      if (path.includes("anime.html")) pageName = "anime-detail";
      else if (path.includes("watch.html")) pageName = "watch";
      else if (path.includes("login.html")) pageName = "login";
      else if (path.includes("admin.html")) pageName = "admin";
      else if (path.includes("analytics.html")) pageName = "analytics";
      else if (path.includes("profile.html")) pageName = "profile";
      trackPageView(pageName);
    }, 1500);

    // ═══ Session Duration ═══
    setInterval(() => {
      try {
        const start = parseInt(sessionStorage.getItem("toonflix_session_start") || "0");
        if (start > 0) {
          const duration = Math.floor((Date.now() - start) / 1000);
          const sessionId = getSessionId();
          analyticsRef.child("sessions").child(sessionId).set({
            duration,
            lastPing: Date.now()
          });
        }
      } catch (e) {}
    }, 30000);

    console.log("✅ Anime Hindi Zone Analytics loaded");
  } catch (e) {
    console.warn("Analytics init error:", e);
  }
})();
