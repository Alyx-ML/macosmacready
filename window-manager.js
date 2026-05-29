// MacReady shared window, dock motion, and menu bar behavior
// Extracted from app.js so window behavior can be maintained independently.

let dockMotionList = [];
function initDockMagnification() {
  const dock = document.getElementById("dock");
  const dockContainer = document.getElementById("dock-container");
  if (!dock || !dockContainer) return;

  const refreshDockItems = () => {
    const items = Array.from(dock.querySelectorAll(".dock-item-wrapper"));
    dockMotionList = items.map(item => {
      const existing = dockMotionList.find(e => e.item === item);
      return existing || { item, current: 1, target: 1 };
    });
  };

  refreshDockItems();
  window.refreshDockMagnification = refreshDockItems;

  let dockMotionFrame = null;

  const renderDockMotion = () => {
    let moving = false;

    dockMotionList.forEach(entry => {
      entry.current += (entry.target - entry.current) * 0.28;
      if (Math.abs(entry.target - entry.current) > 0.001) moving = true;

      const scale = entry.current;
      entry.item.style.transform = `scale(${scale}) translateY(${-15 * (scale - 1)}px)`;

      const dockItem = entry.item.querySelector(".dock-item");
      if (dockItem) {
        const margin = 5 * (scale - 1);
        dockItem.style.margin = `0 ${margin}px 4px ${margin}px`;
      }
    });

    if (moving) {
      dockMotionFrame = requestAnimationFrame(renderDockMotion);
    } else {
      dockMotionFrame = null;
    }
  };

  const startDockMotion = () => {
    if (!dockMotionFrame) {
      dockMotionFrame = requestAnimationFrame(renderDockMotion);
    }
  };

  dock.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    dockMotionList.forEach((entry) => {
      const item = entry.item;
      const rect = item.getBoundingClientRect();
      const itemX = rect.left + rect.width / 2;
      const itemY = rect.top + rect.height;

      // Distance from cursor to dock item bottom-center
      const distX = mouseX - itemX;
      const distY = mouseY - itemY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      // Scale calculations: max scale 1.45 at 0px distance, tapering to 1.0 at 150px distance
      const maxDistance = 150;
      let scale = 1.0;

      if (distance < maxDistance) {
        // Cosine curve for ultra-smooth scaling profile
        const factor = (Math.cos((distance / maxDistance) * Math.PI) + 1) / 2;
        scale = 1.0 + 0.38 * factor;
      }

      entry.target = scale;
    });
    startDockMotion();
  });

  dock.addEventListener("mouseleave", () => {
    // Reset all scale factors smoothly
    dockMotionList.forEach((entry) => {
      entry.target = 1;
    });
    startDockMotion();
  });
}

// --- macOS Tahoe Premium Dragging & Focusing System ---
let maxZIndex = 100;
const MAX_WINDOW_Z_INDEX = 7900;

function updateGlobalMenuBar() {
  const topWin = getTopVisibleWindow();
  const notesMenuGroup = document.getElementById("notes-menu-group");
  const activeAppLabel = document.getElementById("menu-active-app");
  
  if (activeAppLabel) {
    if (topWin) {
      if (topWin.id === "textedit-window") {
        activeAppLabel.textContent = "Notes";
      } else if (topWin.id === "calculator-window") {
        activeAppLabel.textContent = "Calculator";
      } else if (topWin.id === "terminal-window") {
        activeAppLabel.textContent = "Terminal";
      } else if (topWin.id === "settings-window") {
        activeAppLabel.textContent = "Settings";
      } else if (topWin.id === "account-window") {
        activeAppLabel.textContent = "User Account";
      } else if (topWin.id === "app-window") {
        const appNames = {
          news: "News",
          reviews: "Reviews",
          crossover: "CrossOver",
          macos: "macOS Notes",
          games: "Games",
          "app-store": "App Store",
          finder: "Finder"
        };
        activeAppLabel.textContent = appNames[currentApp] || "News";
      } else {
        activeAppLabel.textContent = "";
      }
    } else {
      activeAppLabel.textContent = "";
    }
  }
  
  if (notesMenuGroup) {
    if (topWin && topWin.id === "textedit-window") {
      notesMenuGroup.style.display = "flex";
    } else {
      notesMenuGroup.style.display = "none";
    }
  }
}

function refreshGlobalMenuBarSoon() {
  requestAnimationFrame(updateGlobalMenuBar);
}

function bringWindowToFront(windowEl) {
  maxZIndex = Math.min(maxZIndex + 1, MAX_WINDOW_Z_INDEX);
  windowEl.style.zIndex = maxZIndex;
  refreshGlobalMenuBarSoon();
}

function getTopVisibleWindow() {
  const visibleWindows = [...document.querySelectorAll("#app-window, #settings-window, #account-window, #terminal-window, #calculator-window, #textedit-window, .utility-window")]
    .filter(win => !win.classList.contains("hidden-window") && !win.classList.contains("minimized"));

  return visibleWindows.reduce((topWindow, win) => {
    const winZ = Number.parseInt(getComputedStyle(win).zIndex, 10) || 0;
    const topZ = topWindow ? Number.parseInt(getComputedStyle(topWindow).zIndex, 10) || 0 : -1;
    return winZ > topZ ? win : topWindow;
  }, null);
}

const MAXIMIZE_RESTORE_PROPS = [
  "position",
  "left",
  "top",
  "width",
  "height",
  "maxWidth",
  "margin",
  "transform",
  "borderRadius",
  "animation"
];

function toggleWindowMaximized(windowEl) {
  if (!windowEl) return;

  if (windowEl.classList.contains("maximized")) {
    const restoreState = JSON.parse(windowEl.dataset.maximizeRestoreState || "{}");
    windowEl.classList.remove("maximized");

    MAXIMIZE_RESTORE_PROPS.forEach(prop => {
      const value = restoreState.styles?.[prop];
      if (value) {
        windowEl.style[prop] = value;
      } else {
        windowEl.style.removeProperty(prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
      }
    });

    windowEl.classList.toggle("freeform-window", Boolean(restoreState.freeformWindow));
    delete windowEl.dataset.maximizeRestoreState;
    bringWindowToFront(windowEl);
    return;
  }

  windowEl.dataset.maximizeRestoreState = JSON.stringify({
    freeformWindow: windowEl.classList.contains("freeform-window"),
    styles: Object.fromEntries(MAXIMIZE_RESTORE_PROPS.map(prop => [prop, windowEl.style[prop] || ""]))
  });

  MAXIMIZE_RESTORE_PROPS.forEach(prop => {
    windowEl.style.removeProperty(prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
  });
  windowEl.classList.remove("freeform-window");
  windowEl.classList.add("maximized");
  bringWindowToFront(windowEl);
}

function makeWindowDraggable(windowEl) {
  const titlebar = windowEl.querySelector(".window-titlebar");
  if (!titlebar) return;

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const isMainWindow = windowEl.id === "app-window";
  const isSettingsWindow = windowEl.id === "settings-window";
  const isAccountWindow = windowEl.id === "account-window";
  const isBoundedWindow = isMainWindow || isSettingsWindow || isAccountWindow;

  function getWindowDragBounds(width, height) {
    const menuBar = document.getElementById("menu-bar");
    const dock = document.getElementById("dock-container");
    const menuRect = menuBar?.getBoundingClientRect();
    const dockRect = dock?.getBoundingClientRect();
    const top = menuRect && menuRect.height > 0 ? menuRect.bottom + 8 : 8;
    const bottom = dockRect && dockRect.height > 0 ? dockRect.top - 8 : window.innerHeight - 8;
    const maxHeight = Math.max(220, bottom - top);
    const adjustedHeight = Math.min(height, maxHeight);

    return {
      minLeft: 8,
      maxLeft: Math.max(8, window.innerWidth - width - 8),
      minTop: top,
      maxTop: Math.max(top, bottom - adjustedHeight),
      height: adjustedHeight
    };
  }

  titlebar.style.cursor = "grab";
  titlebar.addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(e) {
    e = e || window.event;
    if (e.button !== 0) return;
    if (e.target.closest(".traffic-lights") || e.target.closest("button, input, textarea, select, a")) return;
    
    e.preventDefault();
    bringWindowToFront(windowEl);

    if (isBoundedWindow) {
      const rect = windowEl.getBoundingClientRect();
      const bounds = getWindowDragBounds(rect.width, rect.height);
      windowEl.classList.remove("maximized");
      windowEl.classList.add("freeform-window");
      windowEl.style.position = "fixed";
      windowEl.style.left = `${Math.min(Math.max(rect.left, bounds.minLeft), bounds.maxLeft)}px`;
      windowEl.style.top = `${Math.min(Math.max(rect.top, bounds.minTop), bounds.maxTop)}px`;
      windowEl.style.width = `${rect.width}px`;
      windowEl.style.height = `${bounds.height}px`;
      windowEl.style.maxWidth = "none";
      windowEl.style.margin = "0";
      if (isSettingsWindow) {
        windowEl.style.animation = "none";
      }
    }
    
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    windowEl.classList.add("dragging-window");
    windowEl.style.transition = "none";
    windowEl.style.transform = "none";
    windowEl.style.rotate = "0deg";
    titlebar.style.cursor = "grabbing";
    
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    let nextTop = windowEl.offsetTop - pos2;
    let nextLeft = windowEl.offsetLeft - pos1;

    if (isBoundedWindow) {
      const bounds = getWindowDragBounds(windowEl.offsetWidth, windowEl.offsetHeight);
      nextTop = Math.min(Math.max(nextTop, bounds.minTop), bounds.maxTop);
      nextLeft = Math.min(Math.max(nextLeft, bounds.minLeft), bounds.maxLeft);
    }

    windowEl.style.top = `${nextTop}px`;
    windowEl.style.left = `${nextLeft}px`;
    windowEl.style.transform = "none";
    windowEl.style.rotate = "0deg";
  }

  function closeDragElement() {
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
    
    windowEl.classList.remove("dragging-window");
    windowEl.style.transition = "opacity 0.5s ease, filter 0.5s ease";
    windowEl.style.transform = "none";
    windowEl.style.rotate = "0deg";
    titlebar.style.cursor = "grab";
  }
}

function updateAppHeader() {
  const appHeader = document.querySelector('button[data-menu="app-menu"]');
  if (appHeader) {
    appHeader.textContent = currentUsername;
  }
  refreshGlobalMenuBarSoon();
}
