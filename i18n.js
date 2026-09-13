// ═══════════════════════════════════════════
// ANIME HINDI ZONE - TRANSLATIONS
// ═══════════════════════════════════════════

window.I18N = {
  hi: {
    home: "होम", search: "खोजें", genres: "जॉनर", admin: "एडमिन",
    profile: "प्रोफ़ाइल", search_placeholder: "Anime search karein...",
    newly_updated: "नई अपडेट", top_10: "टॉप 10 इस हफ्ते",
    all_anime: "सभी एनीमे", continue_watching: "देखना जारी रखें",
    clear: "साफ़ करें", see_all: "सभी देखें →", episodes: "एपिसोड",
    watch_now: "अभी देखें", watch_online: "ऑनलाइन देखें",
    telegram: "टेलीग्राम", download: "डाउनलोड", comments: "कमेंट",
    share: "शेयर", favorite: "पसंदीदा", rating: "रेटिंग",
    previous: "पिछला", next: "अगला", no_previous: "पिछला नहीं",
    no_next: "अगला नहीं", add_comment: "कमेंट जोड़ें",
    your_name: "आपका नाम...", write_comment: "कमेंट लिखें...",
    post_comment: "कमेंट पोस्ट करें", favorites: "पसंदीदा",
    my_favorites: "मेरी पसंदीदा", no_favorites: "अभी कोई पसंदीदा नहीं",
    notifications: "सूचनाएं", no_notifications: "कोई सूचना नहीं",
    mark_all_read: "सभी पढ़ा हुआ मार्क करें", login: "लॉगिन",
    logout: "लॉगआउट", sign_in: "साइन इन करें", guest: "मेहमान",
    filter: "फ़िल्टर", apply_filter: "फ़िल्टर लगाएं",
    reset_filter: "रीसेट करें", genre: "जॉनर", year: "साल",
    rating_filter: "रेटिंग", format: "फॉर्मेट", all: "सभी",
    loading: "लोड हो रहा है...", copied: "कॉपी हो गया!",
    share_anime: "एनीमे शेयर करें"
  },
  en: {
    home: "Home", search: "Search", genres: "Genres", admin: "Admin",
    profile: "Profile", search_placeholder: "Search anime...",
    newly_updated: "Newly Updated", top_10: "Top 10 This Week",
    all_anime: "All Anime", continue_watching: "Continue Watching",
    clear: "Clear", see_all: "See All →", episodes: "Episodes",
    watch_now: "Watch Now", watch_online: "Watch Online",
    telegram: "Telegram", download: "Download", comments: "Comments",
    share: "Share", favorite: "Favorite", rating: "Rating",
    previous: "Previous", next: "Next", no_previous: "No Previous",
    no_next: "No Next", add_comment: "Add Comment",
    your_name: "Your name...", write_comment: "Write a comment...",
    post_comment: "Post Comment", favorites: "Favorites",
    my_favorites: "My Favorites", no_favorites: "No favorites yet",
    notifications: "Notifications", no_notifications: "No notifications",
    mark_all_read: "Mark all read", login: "Login",
    logout: "Logout", sign_in: "Sign In", guest: "Guest",
    filter: "Filter", apply_filter: "Apply Filter",
    reset_filter: "Reset", genre: "Genre", year: "Year",
    rating_filter: "Rating", format: "Format", all: "All",
    loading: "Loading...", copied: "Copied!",
    share_anime: "Share Anime"
  }
};

window.t = function(key) {
  const lang = window.ToonLang ? ToonLang.get() : "hi";
  return (I18N[lang] && I18N[lang][key]) || I18N.hi[key] || key;
};
