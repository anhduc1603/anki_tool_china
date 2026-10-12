// Tab Them tu moi: form + dan anh, danh sach tu, preview the, xuat .apkg.

import { EVENTS, TAB_IDS } from "../../constants.js";
import { on } from "../../core/events.js";
import { createCategoryOptions } from "./category-options.js";
import { initDeckExport } from "./deck-export.js";
import { initImport } from "./import/index.js";
import { queryElements } from "./elements.js";
import { createImageFields } from "./image-fields.js";
import { createPreview } from "./preview.js";
import { state } from "./state.js";
import { createWordForm } from "./word-form.js";
import { createWordList } from "./word-list.js";

export function initAddWord() {
  const els = queryElements();

  // Cac module tham chieu nhau qua callback; khai bao xong het roi moi dung (khong goi luc khai bao).
  const imageFields = createImageFields({ onChange: () => preview.update() });
  const preview = createPreview(els, imageFields);
  const wordList = createWordList(els, {
    onEdit: (word) => form.loadWord(word),
    onDeleted: (id) => {
      if (state.editingWordId === id) form.reset();
    },
    onRendered: () => deckExport.updateCount(),
  });
  const importSelect = document.getElementById("import-category");
  const categoryOptions = createCategoryOptions(els, importSelect, {
    onScopeChange: () => {
      deckExport.suggestDeckName();
      wordList.refresh();
    },
  });
  const form = createWordForm(els, {
    imageFields,
    preview,
    onSaved: wordList.refresh,
    defaultCategory: categoryOptions.defaultFormCategory,
    categoryLabel: () => categoryOptions.categoryLabel(els.wordCategory),
  });
  const deckExport = initDeckExport(els, { scopeName: categoryOptions.scopeName });
  initImport({
    onImported: wordList.refresh,
    categorySelect: importSelect,
    categoryLabel: () => categoryOptions.categoryLabel(importSelect),
  });

  // Danh muc/gan danh muc co the da doi o tab khac: nap lai khi tab nay duoc mo
  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.ADD) refreshAll();
  });

  async function refreshAll() {
    await categoryOptions.load();
    deckExport.suggestDeckName();
    await wordList.refresh();
  }

  preview.update();
  refreshAll();
}
