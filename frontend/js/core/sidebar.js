// Menu trai: thu gon/mo rong (man hinh rong, nho trang thai), ngan keo (man hinh hep),
// tieu de thanh tren cung va danh dau muc dang mo. Chi doi class tren #app-shell; hien thi do CSS lo.

import { EVENTS, NARROW_SCREEN_QUERY, SIDEBAR_STORAGE_KEY } from "../constants.js";
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

  // Tieu de thanh tren cung + danh dau muc dang mo; chon muc (ke ca do activate-tab) thi dong ngan keo
  function markCurrent(tabId) {
    sidebar.querySelectorAll(".tab-btn").forEach((btn) => {
      const current = btn.dataset.tab === tabId;
      if (current) {
        btn.setAttribute("aria-current", "page");
        title.textContent = btn.querySelector(".nav-label").textContent;
      } else {
        btn.removeAttribute("aria-current");
      }
    });
  }

  on(EVENTS.TAB_ACTIVATED, (e) => {
    markCurrent(e.detail.tabId);
    closeDrawer({ restoreFocus: false });
  });

  // Khoi tao: ap trang thai da luu (script inline trong index.html da lam truoc khi ve) va muc dang mo
  shell.classList.toggle("sidebar-collapsed", readCollapsed());
  const active = sidebar.querySelector(".tab-btn.active");
  if (active) markCurrent(active.dataset.tab);
  syncAria();
}
