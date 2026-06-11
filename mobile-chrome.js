// MacReady mobile & tablet chrome — tab bar, sheets, and layout helpers

const MOBILE_LAYOUT_QUERY = "(max-width: 1024px)";
const MOBILE_MORE_APPS = new Set(["crossover", "app-store", "macos"]);

let mobileLayoutActive = false;

function isMobileLayout() {
  return window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
}

function getVisibleAppSidebar() {
  const activeView = document.querySelector(".app-view-container:not(.hidden-app) .window-sidebar");
  return activeView || null;
}

function closeMobileSidebars() {
  document.querySelectorAll(".window-sidebar.mobile-open").forEach(sidebar => {
    sidebar.classList.remove("mobile-open");
  });
  const backdrop = document.getElementById("mobile-sidebar-backdrop");
  if (backdrop) backdrop.classList.add("hidden");
}

function toggleActiveSidebar() {
  const sidebar = getVisibleAppSidebar();
  if (!sidebar) return false;

  const willOpen = !sidebar.classList.contains("mobile-open");
  closeMobileSidebars();
  if (willOpen) {
    sidebar.classList.add("mobile-open");
    const backdrop = document.getElementById("mobile-sidebar-backdrop");
    if (backdrop) backdrop.classList.remove("hidden");
  }
  return true;
}

function setMobileDockActive(tabName = "") {
  const tabBar = document.getElementById("mobile-tab-bar");
  if (!tabBar) return;

  tabBar.querySelectorAll("[data-mobile-tab]").forEach(wrapper => {
    const isActive = Boolean(tabName) && wrapper.getAttribute("data-mobile-tab") === tabName;
    wrapper.classList.toggle("active", isActive);
    wrapper.setAttribute("aria-current", isActive ? "page" : "false");
    const dot = wrapper.querySelector(".dock-indicator");
    if (dot) dot.classList.toggle("active-dot", isActive);
  });
}

function syncMobileTabBar(appName = "") {
  if (!mobileLayoutActive) return;

  let activeTab = "";
  if (appName === "news" || appName === "reviews") activeTab = "news";
  else if (appName === "games") activeTab = "games";
  else if (MOBILE_MORE_APPS.has(appName)) activeTab = "more";

  if (!activeTab) return;
  setMobileDockActive(activeTab);
}

function setMobileLayoutState(active) {
  mobileLayoutActive = active;
  document.body.classList.toggle("mobile-layout", active);
  document.body.classList.toggle("tablet-layout", active && window.matchMedia("(min-width: 601px)").matches);

  const tabBar = document.getElementById("mobile-tab-bar");
  if (tabBar) tabBar.classList.toggle("hidden", !active);

  if (!active) {
    closeMobileSidebars();
    closeMobileMoreSheet();
  } else if (typeof currentApp === "string") {
    syncMobileTabBar(currentApp);
  }
}

function openMobileMoreSheet() {
  const sheet = document.getElementById("mobile-more-sheet");
  const backdrop = document.getElementById("mobile-more-backdrop");
  if (!sheet || !backdrop) return;
  sheet.classList.remove("hidden");
  backdrop.classList.remove("hidden");
  document.body.classList.add("mobile-sheet-open");
}

function closeMobileMoreSheet() {
  const sheet = document.getElementById("mobile-more-sheet");
  const backdrop = document.getElementById("mobile-more-backdrop");
  const wasOpen = sheet && !sheet.classList.contains("hidden");
  if (sheet) sheet.classList.add("hidden");
  if (backdrop) backdrop.classList.add("hidden");
  document.body.classList.remove("mobile-sheet-open");
  if (wasOpen && mobileLayoutActive && typeof currentApp === "string") {
    syncMobileTabBar(currentApp);
  }
}

function flashMobileDockTooltip(wrapper) {
  if (!wrapper) return;
  wrapper.classList.add("show-tooltip");
  window.setTimeout(() => wrapper.classList.remove("show-tooltip"), 900);
}

function handleMobileTabClick(tabName) {
  closeMobileMoreSheet();
  closeMobileSidebars();

  setMobileDockActive(tabName);

  if (tabName === "news") {
    if (typeof switchApp === "function") switchApp("news");
    const win = document.getElementById("app-window");
    if (win) {
      win.classList.remove("hidden-window", "minimized");
      if (typeof bringWindowToFront === "function") bringWindowToFront(win);
    }
    return;
  }

  if (tabName === "games") {
    if (typeof switchApp === "function") switchApp("games");
    const win = document.getElementById("app-window");
    if (win) {
      win.classList.remove("hidden-window", "minimized");
      if (typeof bringWindowToFront === "function") bringWindowToFront(win);
    }
    return;
  }

  if (tabName === "applications") {
    if (typeof toggleLaunchpad === "function") toggleLaunchpad();
    return;
  }

  if (tabName === "more") {
    openMobileMoreSheet();
  }
}

function handleMobileMoreAction(action) {
  closeMobileMoreSheet();

  if (action === "crossover" || action === "app-store" || action === "macos") {
    if (typeof switchApp === "function") switchApp(action);
    const win = document.getElementById("app-window");
    if (win) {
      win.classList.remove("hidden-window", "minimized");
      if (typeof bringWindowToFront === "function") bringWindowToFront(win);
    }
    syncMobileTabBar(action);
    return;
  }

  if (action === "settings") {
    const win = document.getElementById("settings-window");
    if (win) {
      win.classList.remove("hidden-window", "minimized");
      if (typeof bringWindowToFront === "function") bringWindowToFront(win);
    }
    syncMobileTabBar("more");
    return;
  }

  if (action === "pwa-manager") {
    const win = document.getElementById("pwa-store-window");
    if (win) {
      win.classList.remove("hidden-window", "minimized");
      if (typeof bringWindowToFront === "function") bringWindowToFront(win);
    }
    syncMobileTabBar("more");
  }
}

function normalizeMobileWindow(win) {
  if (!win || !isMobileLayout()) return;
  win.style.width = "100vw";
  win.style.maxWidth = "100vw";
  win.style.left = "0";
  win.style.transform = "none";
  win.style.margin = "0";
  win.style.borderRadius = "0";
  win.style.position = "fixed";
}

function onLaunchpadDismissed() {
  if (!mobileLayoutActive) return;
  if (typeof currentApp === "string") {
    syncMobileTabBar(currentApp);
  }
}

function initMobileChrome() {
  const tabBar = document.getElementById("mobile-tab-bar");
  if (!tabBar || tabBar.dataset.bound === "1") return;
  tabBar.dataset.bound = "1";

  const layoutQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
  const applyLayout = () => {
    setMobileLayoutState(layoutQuery.matches);
    document.querySelectorAll(".utility-window, [id^='iframe-win-']").forEach(normalizeMobileWindow);
  };
  applyLayout();
  if (typeof layoutQuery.addEventListener === "function") {
    layoutQuery.addEventListener("change", applyLayout);
  } else if (typeof layoutQuery.addListener === "function") {
    layoutQuery.addListener(applyLayout);
  }

  tabBar.addEventListener("click", (e) => {
    const wrapper = e.target.closest("[data-mobile-tab]");
    if (!wrapper) return;
    e.preventDefault();
    flashMobileDockTooltip(wrapper);
    handleMobileTabClick(wrapper.getAttribute("data-mobile-tab"));
  });

  const moreSheet = document.getElementById("mobile-more-sheet");
  if (moreSheet) {
    moreSheet.addEventListener("click", (e) => {
      const item = e.target.closest("[data-mobile-more]");
      if (!item) return;
      e.preventDefault();
      handleMobileMoreAction(item.getAttribute("data-mobile-more"));
    });
  }

  const moreBackdrop = document.getElementById("mobile-more-backdrop");
  if (moreBackdrop) {
    moreBackdrop.addEventListener("click", closeMobileMoreSheet);
  }

  const sidebarBackdrop = document.getElementById("mobile-sidebar-backdrop");
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", closeMobileSidebars);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileMoreSheet();
      closeMobileSidebars();
    }
  });

  window.macreadyMobile = {
    isActive: isMobileLayout,
    toggleActiveSidebar,
    closeMobileSidebars,
    syncTabBar: syncMobileTabBar,
    normalizeMobileWindow,
    onLaunchpadDismissed
  };

  if (typeof currentApp === "string") syncMobileTabBar(currentApp);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMobileChrome);
} else {
  initMobileChrome();
}
