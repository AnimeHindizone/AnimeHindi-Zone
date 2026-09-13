// ═══════════════════════════════════════════
// ANIME HINDI ZONE - ANALYTICS
// ═══════════════════════════════════════════

(function() {
  try {
    const firebaseConfig = { databaseURL: "https://animehindi-zone-default-rtdb.firebaseio.com/" };
    if (typeof firebase === "undefined") return;
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const adb = firebase.database();
    const analyticsRef = adb.ref("analytics");

    function getVisitorId() {
      let vid = localStorage.getItem("toonflix_visitor_id");
      if (!vid) { vid = "v_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9); localStorage.setItem("toonflix_visitor_id", vid); }
      return vid;
    }
    function getDeviceType() {
      const ua = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
      if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "Mobile";
      return "Desktop";
    }
    function getTodayKey() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
    function trackPageView(pageName) {
      try {
        const visitorId = getVisitorId();
        const device = getDeviceType();
        const today = getTodayKey();
        const ts = Date.now();
        analyticsRef.child("daily").child(today).child("visitors").child(visitorId).set(ts);
        analyticsRef.child("daily").child(today).child("pageviews").transaction(c => (c || 0) + 1);
        analyticsRef.child("total").child("pageviews").transaction(c => (c || 0) + 1);
        analyticsRef.child("users").child(visitorId).update({ lastSeen: ts, device });
        analyticsRef.child("pages").child(pageName).transaction(c => (c || 0) + 1);
        analyticsRef.child("devices").child(device).transaction(c => (c || 0) + 1);
        analyticsRef.child("recent").push({ visitorId: visitorId.substr(0, 12) + "...", page: pageName, device, time: ts });
      } catch (e) {}
    }
    setTimeout(() => {
      const path = window.location.pathname;
      let pageName = "home";
      if (path.includes("anime.html")) pageName = "anime-detail";
      else if (path.includes("watch.html")) pageName = "watch";
      else if (path.includes("login.html")) pageName = "login";
      else if (path.includes("admin.html")) pageName = "admin";
      else if (path.includes("analytics.html")) pageName = "analytics";
      trackPageView(pageName);
    }, 1500);

    window.trackEpisodePlay = function(animeId, animeTitle, epNum) {
      try {
        const today = getTodayKey();
        const ts = Date.now();
        analyticsRef.child("episodes").child(animeId).child("plays").transaction(c => (c || 0) + 1);
        analyticsRef.child("episodes").child(animeId).update({ title: animeTitle, lastPlayed: ts });
        analyticsRef.child("daily").child(today).child("episodePlays").transaction(c => (c || 0) + 1);
        analyticsRef.child("episodes").child(animeId).child("eps").child(epNum).transaction(c => (c || 0) + 1);
      } catch (e) {}
    };
    console.log("✅ Anime Hindi Zone analytics loaded");
  } catch (e) {}
})();
