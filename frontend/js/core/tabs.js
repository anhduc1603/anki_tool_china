// Chuyen tab: an/hien panel, danh dau nut tab, phat su kien tab-activated.

import { EVENTS } from "../constants.js";
import { emit, on } from "./events.js";

export function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  function activate(tabId) {
    panels.forEach((p) => p.classList.toggle("hidden", p.id !== tabId));
    tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
    emit(EVENTS.TAB_ACTIVATED, { tabId });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => activate(btn.dataset.tab));
  });

  // Cho phep tab khac chuyen tab bang su kien (vd: bam ten danh muc -> sang tab Hoc)
  on(EVENTS.ACTIVATE_TAB, (e) => activate(e.detail.tabId));
}
