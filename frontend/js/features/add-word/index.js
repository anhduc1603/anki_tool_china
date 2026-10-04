// Tab Them tu moi: form + dan anh, danh sach tu, preview the, xuat .apkg.

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
  });
  const form = createWordForm(els, { imageFields, preview, onSaved: wordList.refresh });
  initDeckExport(els);
  initImport({ onImported: wordList.refresh });

  preview.update();
  wordList.refresh();
}
