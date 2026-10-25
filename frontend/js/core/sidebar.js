// Menu trai: thu gon/mo rong (man hinh rong, nho trang thai), ngan keo (man hinh hep),
// tieu de thanh tren cung va danh dau muc dang mo. Chi doi class tren #app-shell; hien thi do CSS lo.

import { EVENTS, NARROW_SCREEN_QUERY, ROUTES, SIDEBAR_STORAGE_KEY } from "../constants.js";
import { on } from "./events.js";

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch (e) {
    return false; // localStorage bi chan: coi nhu chua luu -> mo rong
  }
}

function saveCollapsed(collapsed) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  } catch (e) {
    /* khong luu duoc thi thoi, app van chay */
  }
}

export function initSidebar() {
  const shell = document.getElementById("app-shell");
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");
  const backdrop = document.getElementById("sidebar-backdrop");
  const title = document.getElementById("topbar-title");
  const narrow = window.matchMedia(NARROW_SCREEN_QUERY);

  const isOpen = () => shell.classList.contains("sidebar-open");
  const isCollapsed = () => shell.classList.contains("sidebar-collapsed");

  function syncAria() {
    const expanded = narrow.matches ? isOpen() : !isCollapsed();
    toggle.setAttribute("aria-expanded", String(expanded));
  }

  function openDrawer() {
    shell.classList.add("sidebar-open");
    syncAria();
    const current = sidebar.querySelector(".tab-btn.active") || sidebar.querySelector(".tab-btn");
    if (current) current.focus();
  }

  function closeDrawer({ restoreFocus = false } = {}) {
    if (!isOpen()) return;
    shell.classList.remove("sidebar-open");
    syncAria();
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    if (narrow.matches) {
      if (isOpen()) closeDrawer({ restoreFocus: true });
      else openDrawer();
    } else {
      const collapsed = shell.classList.toggle("sidebar-collapsed");
      saveCollapsed(collapsed);
      syncAria();
    }
  });

  backdrop.addEventListener("click", () => closeDrawer({ restoreFocus: true }));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeDrawer({ restoreFocus: true });
  });

  // Phong to cua so qua diem ngat: dong ngan keo de khong ket trang thai
  narrow.addEventListener("change", () => {
    closeDrawer();
    syncAria();
  });

  // Tieu de thanh tren cung + <title> tab trinh duyet; chon muc (ke ca do activate-tab) thi dong ngan keo.
  // Trang co the tam doi ten (vd "Sua tu") bang su kien PAGE_TITLE_OVERRIDE.
  const overrides = new Map();
  let currentTab = null;

  function paintTitle() {
    const route = ROUTES.find((r) => r.tabId === currentTab);
    const name = overrides.get(currentTab) || (route ? route.title : "");
    title.textContent = name;
    document.title = name ? `${name} · AnkiTool` : "AnkiTool";
  }

  on(EVENTS.TAB_ACTIVATED, (e) => {
    currentTab = e.detail.tabId;
    paintTitle();
    closeDrawer({ restoreFocus: false });
  });

  on(EVENTS.PAGE_TITLE_OVERRIDE, (e) => {
    if (e.detail.title) overrides.set(e.detail.tabId, e.detail.title);
    else overrides.delete(e.detail.tabId);
    paintTitle();
  });

  // Khoi tao: ap trang thai da luu (script inline trong index.html da lam truoc khi ve) va muc dang mo
  shell.classList.toggle("sidebar-collapsed", readCollapsed());
  syncAria();
}
