// Trang Them / sua tu: form + dan anh, xem truoc the. (Danh sach tu, nhap CSV, xuat .apkg nam o cac trang khac.)

import { EVENTS, TAB_IDS } from "../../constants.js";
import { on } from "../../core/events.js";
import { loadAll, store } from "../../core/store.js";
import { createCategorySelect } from "./category-select.js";
import { queryElements } from "./elements.js";
import { createImageFields } from "./image-fields.js";
import { createImageSuggestions } from "./image-suggestions.js";
import { createPreview } from "./preview.js";
import { createWordForm } from "./word-form.js";

export function initAddWord() {
  const els = queryElements();

  // Cac module tham chieu nhau qua callback; khai bao xong het roi moi dung (khong goi luc khai bao).
  const imageFields = createImageFields({ onChange: () => preview.update() });
  const preview = createPreview(els, imageFields);
  const categories = createCategorySelect(els.wordCategory);
  const suggestions = createImageSuggestions(els, imageFields);
  const form = createWordForm(els, {
    imageFields,
    preview,
    onSaved: loadAll,
    defaultCategory: categories.defaultCategory,
    onReset: (word) => suggestions.reset(word),
  });

  let active = false; // trang Them tu dang hien
  let pendingEdit = null; // tu duoc xin sua trong luc trang chua hien (cac feature khac gui bang su kien)

  // Trang Hoc / Tu vung xin sua 1 tu: nap vao form khi trang nay hien (hoac ngay neu dang hien)
  on(EVENTS.EDIT_WORD_REQUEST, (e) => {
    if (active) form.loadWord(e.detail.word);
    else pendingEdit = e.detail.word;
  });

  // Du lieu doi (them/xoa/doi danh muc o noi khac): lam moi o chon danh muc; neu tu dang sua da bi xoa thi thoat che do sua
  on(EVENTS.DATA_CHANGED, () => {
    categories.refresh();
    if (store.editingWord && store.status === "ready" && !store.words.some((w) => w.id === store.editingWord.id)) form.reset();
  });

  on(EVENTS.TAB_ACTIVATED, (e) => {
    active = e.detail.tabId === TAB_IDS.ADD;
    if (!active) return;
    categories.refresh();
    if (pendingEdit) {
      form.loadWord(pendingEdit);
      pendingEdit = null;
    } else if (!store.editingWord && !els.hanzi.value) {
      els.wordCategory.value = categories.defaultCategory(); // tu moi: chon san danh muc con dang xem o trang Tu vung
    }
    loadAll();
  });

  preview.update();
  form.reset();
}
