// js/navigation.js — SkoolPocket SPA Navigation  v5
// ════════════════════════════════════════════════════════════════

var SCREENS = {
  splash:  "splash-screen",
  auth:    "auth-screen",
  home:    "home-screen",
  shop:    "shop-screen",
  history: "history-screen",
  profile: "profile-screen",
  admin:   "admin-screen",      // ← NEW: admin dashboard
};

var SCREENS_WITH_FOOTER = ["home","shop","history","profile"];

/**
 * navigate(screenName)
 * Hides all screens, shows the target, toggles footer.
 */
function navigate(screenName) {
  State.currentScreen = screenName;

  // Hide every registered screen
  Object.values(SCREENS).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  // Show the target
  const target = document.getElementById(SCREENS[screenName]);
  if (target) target.classList.remove("hidden");

  // Toggle the app wrapper
  const appWrapper = document.getElementById("app-wrapper");
  if (screenName === "splash" || screenName === "auth") {
    appWrapper.classList.add("hidden");
  } else {
    appWrapper.classList.remove("hidden");
  }

  // Toggle footer (admin screen has its own nav, no footer)
  const footer = document.getElementById("app-footer");
  if (footer) {
    if (SCREENS_WITH_FOOTER.includes(screenName)) {
      footer.classList.remove("hidden");
    } else {
      footer.classList.add("hidden");
    }
  }

  highlightFooterTab(screenName);

  // Screen-specific render calls
  if (screenName === "home")    renderHome();
  if (screenName === "history") renderHistory();
  if (screenName === "profile") renderProfile();
  if (screenName === "shop")    renderShop();
  if (screenName === "admin")   renderAdmin();

  // Reset scroll positions on navigation
  const mainScroll   = document.getElementById("main-scroll");
  const adminScreen  = document.getElementById("admin-screen");
  if (mainScroll)  mainScroll.scrollTop  = 0;
  if (adminScreen) adminScreen.scrollTop = 0;
}

function highlightFooterTab(screenName) {
  document.querySelectorAll(".footer-tab").forEach((tab) => {
    tab.classList.remove("text-blue-600","font-bold");
    tab.classList.add("text-gray-400");
    if (tab.dataset.screen === screenName) {
      tab.classList.remove("text-gray-400");
      tab.classList.add("text-blue-600","font-bold");
    }
  });
}

function initNavigation() {
  document.querySelectorAll(".footer-tab").forEach((tab) => {
    tab.addEventListener("click", () => navigate(tab.dataset.screen));
  });
}