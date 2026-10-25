// Chuyen trang: an/hien panel, danh dau muc menu, phat su kien tab-activated.
// Trang hien tai nam tren URL (#overview, #study, ...): tai lai o dau o do, Back/Forward cua trinh duyet doi trang.

import { EVENTS, ROUTES } from "../constants.js";
import { emit, on } from "./events.js";

export function initTabs() {
  const panels = document.querySelectorAll(".tab-panel");
  const buttons = document.querySelectorAll(".tab-btn");
  const routeByTab = new Map(ROUTES.map((r) => [r.tabId, r]));
  let current = null;

  function show(tabId, { scroll = true } = {}) {
    panels.forEach((p) => p.classList.toggle("hidden", p.id !== tabId));
    buttons.forEach((b) => {
      const isCurrent = b.dataset.tab === tabId;
      b.classList.toggle("active", isCurrent);
      if (isCurrent) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    current = tabId;
    if (scroll) window.scrollTo(0, 0);
    emit(EVENTS.TAB_ACTIVATED, { tabId });
  }

  function routeFromHash() {
    const name = window.location.hash.replace(/^#\/?/, "");
    return ROUTES.find((r) => r.hash === name) || null;
  }

  // Doi trang: ghi vao URL (them 1 muc lich su) roi hien thi qua hashchange; cung trang thi chi nap lai
  function navigate(tabId) {
    const route = routeByTab.get(tabId);
    if (!route) return;
    if (window.location.hash === "#" + route.hash) show(tabId);
    else window.location.hash = route.hash;
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => navigate(btn.dataset.tab)));
  window.addEventListener("hashchange", () => {
    const route = routeFromHash() || ROUTES[0];
    if (route.tabId !== current) show(route.tabId);
  });

  // Cho phep trang khac chuyen trang bang su kien (vd: bam ten danh muc -> sang tab Hoc)
  on(EVENTS.ACTIVATE_TAB, (e) => navigate(e.detail.tabId));

  // Mo app: theo dia chi; khong co/sai thi ve Tong quan (khong chong them lich su)
  const first = routeFromHash();
  if (!first) window.history.replaceState(null, "", "#" + ROUTES[0].hash);
  show((first || ROUTES[0]).tabId, { scroll: false });
}
