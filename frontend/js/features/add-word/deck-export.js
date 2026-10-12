// Nut "Xuat .apkg": tai file Anki chua cac tu trong pham vi danh muc dang loc; ten deck goi y theo danh muc.

import { exportUrl } from "../../api/words-api.js";
import { state } from "./state.js";

const DEFAULT_DECK_NAME = "MyChineseDeck";

// scopeName(): ten danh muc dang loc (null = ten mac dinh)
export function initDeckExport(els, { scopeName }) {
  let deckNameEdited = false; // nguoi dung da tu go ten deck -> khong ghi de khi doi bo loc

  els.deckName.addEventListener("input", () => {
    deckNameEdited = true;
  });

  // So tu se xuat chinh la so tu dang hien trong danh sach
  function updateCount() {
    els.exportCount.textContent = `(${state.words.length} từ)`;
  }

  // Doi bo loc: goi y ten deck theo danh muc (tru khi nguoi dung da tu dat ten)
  function suggestDeckName() {
    if (!deckNameEdited) els.deckName.value = scopeName() || DEFAULT_DECK_NAME;
  }

  els.exportBtn.addEventListener("click", () => {
    if (state.words.length === 0) {
      alert("Không có từ nào để xuất trong danh sách đang chọn. Hãy thêm từ hoặc chọn danh mục khác.");
      return;
    }
    // Chi doi ky tu khong dung duoc trong ten file; giu nguyen chu co dau / chu Han
    const deckName = (els.deckName.value.trim() || DEFAULT_DECK_NAME).replace(/[\\/:*?"<>|]/g, "_");
    window.location.href = exportUrl(deckName, state.scope);
  });

  return { updateCount, suggestDeckName };
}
