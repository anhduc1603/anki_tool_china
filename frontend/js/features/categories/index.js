// Tab Quan ly danh muc: bang danh muc (deck list), menu ⚙, panel gan tu.

import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "../../api/categories-api.js";
import { fetchCounts } from "../../api/study-api.js";
import { listWords } from "../../api/words-api.js";
import { EVENTS, TAB_IDS } from "../../constants.js";
import { emit, on } from "../../core/events.js";
import { createAssignPanel } from "./assign-panel.js";
import { createCategoryTable } from "./category-table.js";
import { createGearMenu } from "./gear-menu.js";
import { state } from "./state.js";

export function initCategories() {
  const els = {
    newParentName: document.getElementById("new-parent-name"),
    addParentBtn: document.getElementById("add-parent-btn"),
    msg: document.getElementById("category-msg"),
    table: document.getElementById("deck-table"),
    gearMenu: document.getElementById("gear-menu"),
    assignScope: document.getElementById("assign-scope"),
    assignList: document.getElementById("assign-list"),
  };

  function setMsg(text, type) {
    els.msg.textContent = text || "";
    els.msg.className = "form-msg" + (type ? " " + type : "");
  }

  async function loadData() {
    const [cats, words, counts] = await Promise.all([listCategories(), listWords(), fetchCounts()]);
    state.categories = cats.data;
    state.words = words.data;
    state.counts = counts.data;
    render();
  }

  function render() {
    table.render();
    assignPanel.render();
  }

  function openStudy(scope) {
    emit(EVENTS.STUDY_SCOPE_REQUEST, { scope });
    emit(EVENTS.ACTIVATE_TAB, { tabId: TAB_IDS.STUDY });
  }

  async function runMenuAction(action, cat) {
    if (action === "rename") {
      const name = prompt("Tên mới:", cat.name);
      if (!name || !name.trim()) return;
      const { ok, data } = await renameCategory(cat.id, name.trim());
      if (!ok) return setMsg(data.error || "Lỗi đổi tên.", "error");
    } else if (action === "add-child") {
      const name = prompt(`Tên danh mục con mới trong "${cat.name}":`);
      if (!name || !name.trim()) return;
      const { ok, data } = await createCategory(name.trim(), cat.id);
      if (!ok) return setMsg(data.error || "Lỗi thêm danh mục con.", "error");
      state.collapsed.delete(cat.id);
    } else if (action === "delete") {
      if (!confirm(`Xóa danh mục "${cat.name}"?`)) return;
      const { ok, data } = await deleteCategory(cat.id);
      if (!ok) return setMsg(data.error || "Lỗi xóa danh mục.", "error");
      state.collapsed.delete(cat.id);
    }
    setMsg("", "");
    await loadData();
  }

  const gearMenu = createGearMenu(els.gearMenu, { onAction: runMenuAction });
  const table = createCategoryTable(els.table, {
    onStudy: openStudy,
    onGear: (btn) => gearMenu.toggle(btn),
  });
  const assignPanel = createAssignPanel(els.assignScope, els.assignList, {
    onResult: async (ok, error) => {
      if (!ok) setMsg(error || "Lỗi gán danh mục.", "error");
      else setMsg("", "");
      await loadData();
    },
  });

  els.addParentBtn.addEventListener("click", async () => {
    const name = els.newParentName.value.trim();
    if (!name) return;
    const { ok, data } = await createCategory(name);
    if (!ok) return setMsg(data.error || "Lỗi thêm danh mục.", "error");
    els.newParentName.value = "";
    setMsg("", "");
    await loadData();
  });

  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.CATEGORIES) loadData();
  });

  loadData();
}
