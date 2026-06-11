// Control Center, segment switcher, and other desktop chrome interactions.

function syncViewSegmentControl(mode) {
  const control = document.getElementById("view-segment-control");
  if (!control) return;
  control.dataset.activeView = mode;
  control.style.setProperty("--active-index", mode === "grid" ? "0" : "1");
}

function initControlCenter() {
  const widgetToggle = document.getElementById("control-center-toggle");
  const widgetDrawer = document.getElementById("widget-center");
  const tabNotifications = document.getElementById("tab-notifications");
  const tabWidgets = document.getElementById("tab-widgets");
  const paneNotifications = document.getElementById("pane-notifications");
  const paneWidgets = document.getElementById("pane-widgets");
  const tabPill = document.querySelector(".tahoe-tab-pill");
  const dateTimeToggle = document.getElementById("date-time-toggle");
  let widgetCenterMode = "widgets";
  let widgetCenterCloseTimer = null;

  const switchTahoeTab = (activeTabId) => {
    if (activeTabId === "tab-notifications") {
      widgetCenterMode = "notifications";
      if (tabNotifications) tabNotifications.classList.add("active");
      if (tabWidgets) tabWidgets.classList.remove("active");
      if (paneNotifications) paneNotifications.classList.add("active");
      if (paneWidgets) paneWidgets.classList.remove("active");
      if (tabPill) tabPill.style.transform = "translateX(0)";
    } else {
      widgetCenterMode = "widgets";
      if (tabWidgets) tabWidgets.classList.add("active");
      if (tabNotifications) tabNotifications.classList.remove("active");
      if (paneWidgets) paneWidgets.classList.add("active");
      if (paneNotifications) paneNotifications.classList.remove("active");
      if (tabPill) tabPill.style.transform = "translateX(calc(100% - 2px))";
      if (typeof renderBookmarksWidget === "function") renderBookmarksWidget();
    }
  };

  const finishWidgetCenterClose = () => {
    if (widgetCenterCloseTimer) {
      clearTimeout(widgetCenterCloseTimer);
      widgetCenterCloseTimer = null;
    }
    if (!widgetDrawer) return;
    widgetDrawer.classList.remove("show", "cc-opening", "cc-closing");
  };

  const closeWidgetCenter = () => {
    if (!widgetDrawer) return;
    if (!widgetDrawer.classList.contains("show")) {
      if (widgetToggle) widgetToggle.classList.remove("active");
      return;
    }
    if (widgetDrawer.classList.contains("cc-closing")) return;

    widgetDrawer.classList.remove("cc-opening");
    widgetDrawer.classList.add("cc-closing");
    if (widgetToggle) widgetToggle.classList.remove("active");

    if (widgetCenterCloseTimer) clearTimeout(widgetCenterCloseTimer);
    widgetCenterCloseTimer = setTimeout(finishWidgetCenterClose, 400);
  };

  const openWidgetCenter = () => {
    if (!widgetDrawer) return;
    if (widgetCenterCloseTimer) {
      clearTimeout(widgetCenterCloseTimer);
      widgetCenterCloseTimer = null;
    }
    widgetDrawer.classList.remove("show", "cc-opening", "cc-closing");
    void widgetDrawer.offsetWidth;
    requestAnimationFrame(() => {
      widgetDrawer.classList.add("show", "cc-opening");
    });
  };

  const toggleWidgetCenter = (mode, e) => {
    if (e) e.stopPropagation();
    if (!widgetDrawer || !widgetToggle) return;

    const isOpenInSameMode = widgetDrawer.classList.contains("show") && widgetCenterMode === mode;
    if (isOpenInSameMode) {
      closeWidgetCenter();
      return;
    }

    switchTahoeTab(mode === "notifications" ? "tab-notifications" : "tab-widgets");
    openWidgetCenter();
    widgetToggle.classList.toggle("active", mode === "widgets");
  };

  window.closeWidgetCenter = closeWidgetCenter;

  if (widgetToggle) widgetToggle.addEventListener("click", (e) => toggleWidgetCenter("widgets", e));
  if (dateTimeToggle) dateTimeToggle.addEventListener("click", (e) => toggleWidgetCenter("notifications", e));

  if (widgetDrawer) {
    widgetDrawer.addEventListener("animationend", (e) => {
      if (e.target !== widgetDrawer) return;
      if (e.animationName === "cc-panel-fade-in" || e.animationName === "cc-panel-fade-in-reduced") {
        widgetDrawer.classList.remove("cc-opening");
      }
      if (e.animationName === "cc-panel-fade-out" || e.animationName === "cc-panel-fade-out-reduced") {
        finishWidgetCenterClose();
      }
    });

    document.addEventListener("click", (e) => {
      if (!widgetDrawer.classList.contains("show")) return;

      const clickedInsidePanel = widgetDrawer.contains(e.target);
      const clickedControlCenter = widgetToggle && widgetToggle.contains(e.target);
      const clickedDateTime = dateTimeToggle && dateTimeToggle.contains(e.target);

      if (!clickedInsidePanel && !clickedControlCenter && !clickedDateTime) {
        closeWidgetCenter();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 900 && widgetDrawer && widgetToggle) {
      finishWidgetCenterClose();
      widgetToggle.classList.remove("active");
    }
  });

  if (tabNotifications) tabNotifications.addEventListener("click", () => switchTahoeTab("tab-notifications"));
  if (tabWidgets) tabWidgets.addEventListener("click", () => switchTahoeTab("tab-widgets"));
}

function initDesktopChrome() {
  initControlCenter();
}
