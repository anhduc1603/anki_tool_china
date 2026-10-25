// Trang Tu vung: cay danh muc (quan ly tai cho) + bang tu cua pham vi dang chon + thanh cong cu (them/nhap/xuat).
// Du lieu o core/store.js; trang nap lai moi lan mo va sau moi thay doi.

import { assignWordCategory, assignWordsCategory, createCategory, deleteCategory, renameCategory } from "../../api/categories-api.js";
import { deleteWord } from "../../api/words-api.js";
import { EVENTS, TAB_IDS, UNCATEGORIZED } from "../../constants.js";
import { confirmDialog, promptDialog } from "../../core/dialog.js";
import { emit, on } from "../../core/events.js";
import { icon } from "../../core/icons.js";
import { loadAll, store } from "../../core/store.js";
import { toast } from "../../core/toast.js";
import { categoryName, filterByScope } from "../../core/word-scope.js";
import { playAudioForText } from "../../shared/audio.js";
import { createBulkBar } from "./bulk-bar.js";
import { createCategoryList } from "./category-list.js";
import { createExportPanel } from "./export-panel.js";
import { createGearMenu } from "./gear-menu.js";
import { createWordTable } from "./word-table.js";

export function initLibrary() {
  const $ = (id) => document.getElementById(id);
  const els = {
    heading: $("lib-heading"),
    count: $("lib-count"),
    state: $("lib-state"),
    tableWrap: $("lib-table-wrap"),
    rows: $("lib-rows"),
    addBtn: $("lib-add-btn"),
    addCategoryBtn: $("lib-add-category-btn"),
    gearMenu: $("gear-menu"),
  };
  let active = false; // trang Tu vung dang hien
  const selected = new Set(); // id cac tu dang chon (chi trong cac tu dang hien)
  let shownWords = []; // cac tu dang hien trong bang (thu tu hien thi)
  let anchorId = null; // tu chon gan nhat (moc cho chon khoang bang Shift)

  const exportPanel = createExportPanel();

  function scopeHeading() {
    if (!store.libraryScope) return "Tất cả từ";
    if (store.libraryScope === UNCATEGORIZED) return "Chưa phân loại";
    const name = categoryName(store.categories, store.libraryScope);
    return name || "Danh mục";
  }

  // ---- Trang thai tai / loi / rong ----
  function showState(html) {
    els.state.innerHTML = html;
    els.tableWrap.classList.toggle("hidden", !!html);
  }

  function skeletonHtml() {
    const line = '<span class="skeleton" style="height:44px;margin-bottom:8px">.</span>';
    return `<div role="status" aria-label="Đang tải danh sách từ">${line}${line}${line}${line}</div>`;
  }

  function errorHtml() {
    return `<div class="card empty-state error-state" role="alert"><h3>Không tải được danh sách từ</h3><p>Kiểm tra kết nối tới máy chủ rồi thử lại.</p>
      <div class="state-actions"><button type="button" class="btn btn-secondary" data-action="retry">${icon("refresh")}Thử lại</button></div></div>`;
  }

  function emptyHtml() {
    const noWords = store.words.length === 0;
    const text = noWords
      ? "Chưa có từ nào. Hãy thêm từ đầu tiên hoặc nhập nhiều từ từ file CSV do AI tạo."
      : "Chưa có từ nào trong mục này. Thêm từ mới hoặc chuyển từ từ mục khác sang đây bằng ô danh mục trong bảng.";
    return `<div class="card empty-state">${icon("library", { className: "icon-lg" })}<h3>Chưa có từ</h3><p>${text}</p>
      <div class="state-actions"><button type="button" class="btn btn-primary" data-action="add">${icon("plus")}Thêm từ</button></div></div>`;
  }

  // ---- Ve lai theo kho du lieu ----
  function render() {
    categoryList.render();
    const words = filterByScope(store.words, store.categories, store.libraryScope);
    els.heading.textContent = scopeHeading();
    els.count.textContent = `${words.length} từ`;
    exportPanel.update(words.length);
    shownWords = words;
    pruneSelection();

    if (store.status === "error") {
      table.render([]);
      showState(errorHtml());
      return;
    }
    if (store.status !== "ready" && store.words.length === 0) {
      table.render([]);
      showState(skeletonHtml());
      return;
    }
    if (words.length === 0) {
      table.render([]);
      showState(emptyHtml());
      return;
    }
    showState("");
    table.render(words, selected);
    bulkBar.update(selected.size);
  }

  // ---- Chon nhieu tu ----
  // Bo khoi lua chon cac tu khong con trong bang (doi danh muc xem, vua duoc chuyen di, bi xoa)
  function pruneSelection() {
    const present = new Set(shownWords.map((w) => w.id));
    selected.forEach((id) => {
      if (!present.has(id)) selected.delete(id);
    });
    if (anchorId && !present.has(anchorId)) anchorId = null;
  }

  function selectionChanged() {
    table.syncSelection(selected);
    bulkBar.update(selected.size);
  }

  function onSelect(id, checked, shift) {
    const ids = shownWords.map((w) => w.id);
    if (shift && anchorId && ids.includes(anchorId)) {
      const [a, b] = [ids.indexOf(anchorId), ids.indexOf(id)].sort((x, y) => x - y);
      ids.slice(a, b + 1).forEach((i) => (checked ? selected.add(i) : selected.delete(i)));
    } else if (checked) selected.add(id);
    else selected.delete(id);
    anchorId = id;
    selectionChanged();
  }

  function onSelectAll(checked) {
    shownWords.forEach((w) => (checked ? selected.add(w.id) : selected.delete(w.id)));
    selectionChanged();
  }

  async function applyBulk(destination) {
    const ids = [...selected];
    if (!ids.length) return;
    const label = bulkBar.destinationLabel();
    bulkBar.setBusy(true);
    try {
      const { ok, data } = await assignWordsCategory(ids, destination);
      if (!ok) {
        toast.error(data.error || "Không chuyển được các từ đã chọn.");
        return; // khong tu nao doi, giu nguyen lua chon
      }
      const missing = data.missing ? ` (${data.missing} từ không còn tồn tại)` : "";
      toast.success(`Đã chuyển ${data.updated} từ sang ${label}${missing}.`);
      selected.clear();
      anchorId = null;
      await loadAll();
    } catch (err) {
      toast.error("Mất kết nối tới máy chủ, chưa từ nào được chuyển.");
    } finally {
      bulkBar.setBusy(false);
    }
  }

  // ---- Thao tac ----
  function openAdd() {
    store.editingWord = null;
    emit(EVENTS.ACTIVATE_TAB, { tabId: TAB_IDS.ADD });
  }

  async function onAssign(word, categoryId, select) {
    const previous = word.category_id || "";
    const { ok, data } = await assignWordCategory(word.id, categoryId || null);
    if (!ok) {
      select.value = previous;
      toast.error(data.error || "Không đổi được danh mục.");
      return;
    }
    const target = categoryId ? categoryName(store.categories, categoryId) : "Chưa phân loại";
    toast.success(`Đã chuyển "${word.hanzi}" sang ${target}.`);
    await loadAll();
  }

  async function onDelete(word) {
    const sure = await confirmDialog({
      title: `Xóa từ "${word.hanzi}"?`,
      message: [`Từ "${word.hanzi}" (${word.meaning}) sẽ bị xóa khỏi danh sách.`, "Ảnh gợi nhớ, ảnh nét viết và âm thanh đính kèm của từ cũng bị xóa. Không thể hoàn tác."],
      confirmLabel: "Xóa từ",
      danger: true,
    });
    if (!sure) return;
    if (await deleteWord(word.id)) {
      if (store.editingWord && store.editingWord.id === word.id) store.editingWord = null;
      toast.success(`Đã xóa "${word.hanzi}".`);
      await loadAll();
    } else {
      toast.error("Không xóa được từ này.");
    }
  }

  async function runGearAction(action, cat) {
    let result;
    if (action === "rename") {
      const name = await promptDialog({ title: "Đổi tên danh mục", label: "Tên mới", value: cat.name, confirmLabel: "Lưu" });
      if (name === null) return;
      result = await renameCategory(cat.id, name);
      if (result.ok) toast.success(`Đã đổi tên thành "${name}".`);
    } else if (action === "add-child") {
      const name = await promptDialog({ title: `Thêm danh mục con trong "${cat.name}"`, label: "Tên danh mục con", confirmLabel: "Thêm" });
      if (name === null) return;
      result = await createCategory(name, cat.id);
      if (result.ok) {
        store.collapsed.delete(cat.id);
        toast.success(`Đã thêm danh mục con "${name}".`);
      }
    } else if (action === "delete") {
      const sure = await confirmDialog({
        title: `Xóa danh mục "${cat.name}"?`,
        message: "Danh mục chỉ xóa được khi không còn danh mục con và không còn từ nào bên trong.",
        confirmLabel: "Xóa danh mục",
        danger: true,
      });
      if (!sure) return;
      result = await deleteCategory(cat.id);
      if (result.ok) {
        store.collapsed.delete(cat.id);
        toast.success(`Đã xóa danh mục "${cat.name}".`);
      }
    } else return;
    if (!result.ok) toast.error(result.data.error || "Thao tác với danh mục không thành công.");
    await loadAll();
  }

  async function addParentCategory() {
    const name = await promptDialog({ title: "Thêm danh mục", label: "Tên danh mục cha mới", confirmLabel: "Thêm" });
    if (name === null) return;
    const { ok, data } = await createCategory(name);
    if (!ok) toast.error(data.error || "Không thêm được danh mục.");
    else toast.success(`Đã thêm danh mục "${name}".`);
    await loadAll();
  }

  const gearMenu = createGearMenu(els.gearMenu, { onAction: runGearAction });
  const categoryList = createCategoryList($("lib-categories"), $("lib-category-select"), {
    onSelect: (scope) => {
      store.libraryScope = scope;
      selected.clear();
      anchorId = null;
      render();
    },
    onGear: (btn) => gearMenu.toggle(btn),
  });
  const table = createWordTable(els.rows, {
    onPlay: (w) => playAudioForText(w.hanzi),
    onEdit: (w) => {
      emit(EVENTS.EDIT_WORD_REQUEST, { word: w });
      emit(EVENTS.ACTIVATE_TAB, { tabId: TAB_IDS.ADD });
    },
    onDelete,
    onAssign,
    onSelect,
    onSelectAll,
  }, $("lib-select-all"));
  const bulkBar = createBulkBar({
    onApply: applyBulk,
    onClear: () => {
      selected.clear();
      anchorId = null;
      selectionChanged();
    },
  });

  els.addBtn.addEventListener("click", openAdd);
  els.addCategoryBtn.addEventListener("click", addParentCategory);
  els.state.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "add") openAdd();
    else if (btn.dataset.action === "retry") {
      store.status = "loading";
      render();
      loadAll();
    }
  });

  on(EVENTS.DATA_CHANGED, () => {
    if (active) render();
  });
  on(EVENTS.TAB_ACTIVATED, (e) => {
    active = e.detail.tabId === TAB_IDS.LIBRARY;
    if (!active) {
      exportPanel.close();
      gearMenu.close();
      return;
    }
    render(); // du lieu da co (neu co) hien ngay, roi nap moi
    loadAll();
  });
}
