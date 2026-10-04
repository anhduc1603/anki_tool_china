// Nut "Xuat .apkg": tai file Anki chua toan bo tu vung.

import { exportUrl } from "../../api/words-api.js";
import { state } from "./state.js";

export function initDeckExport(els) {
  els.exportBtn.addEventListener("click", () => {
    if (state.words.length === 0) {
      alert("Danh sách từ đang trống. Hãy thêm ít nhất 1 từ trước khi xuất file.");
      return;
    }
    const deckName = (els.deckName.value.trim() || "MyChineseDeck").replace(/[^\w\-]/g, "_");
    window.location.href = exportUrl(deckName);
  });
}
