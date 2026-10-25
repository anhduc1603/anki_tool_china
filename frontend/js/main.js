// Diem vao cua frontend: khoi tao tung phan. Moi feature export init() va khong import feature khac.
// initTabs() chay CUOI CUNG de lan hien trang dau tien (theo dia chi) den duoc cac feature da dang ky.

import { EVENTS } from "./constants.js";
import { emit } from "./core/events.js";
import { loadAll } from "./core/store.js";
import { initSidebar } from "./core/sidebar.js";
import { initTabs } from "./core/tabs.js";
import { initAddWord } from "./features/add-word/index.js";
import { initImport } from "./features/import/index.js";
import { initLibrary } from "./features/library/index.js";
import { initOverview } from "./features/overview/index.js";
import { initSettings } from "./features/settings/index.js";
import { initStudy } from "./features/study/index.js";

initSidebar();
initOverview();
initStudy();
initLibrary();
initAddWord();
initSettings();
const importer = initImport({ onImported: loadAll });

// Nut chuyen trang (data-nav="tab-...") va nut mo hop thoai nhap CSV (data-action="open-import") o bat ky trang nao
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) {
    emit(EVENTS.ACTIVATE_TAB, { tabId: nav.dataset.nav });
    return;
  }
  if (e.target.closest('[data-action="open-import"]')) importer.open();
});

// "Bo qua toi noi dung": khong doi dia chi (dia chi dung de chon trang), chi chuyen focus
document.getElementById("skip-link").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("main").focus();
});

initTabs();
