// Nut "Xuat sang Anki (.apkg)" cua trang Tu vung: popover nho co o ten bo the; file chua cac tu cua pham vi dang chon.

import { exportUrl } from "../../api/words-api.js";
import { store } from "../../core/store.js";
import { categoryName } from "../../core/word-scope.js";

const DEFAULT_DECK_NAME = "MyChineseDeck";
const BUSY_MS = 1500;

export function createExportPanel() {
  const $ = (id) => document.getElementById(id);
  const btn = $("lib-export-btn");
  const label = $("lib-export-label");
  const panel = $("lib-export-panel");
  const deckName = $("lib-deck-name");
  const go = $("lib-export-go");
  const hint = $("lib-export-hint");

  let deckNameEdited = false; // nguoi dung da tu go ten bo the -> khong ghi de khi doi pham vi
  let count = 0;

  function isOpen() {
    return !panel.classList.contains("hidden");
  }
  function setOpen(open) {
    panel.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
    if (open) deckName.focus();
  }

  // Ten goi y theo danh muc dang chon (cha hay con deu lay ten danh muc); "Tat ca"/"Chua phan loai" -> ten mac dinh
  function suggestedName() {
    return categoryName(store.categories, store.libraryScope) || DEFAULT_DECK_NAME;
  }

  // Cap nhat theo so tu cua pham vi dang chon (count)
  function update(wordCount) {
    count = wordCount;
    label.textContent = `Xuất sang Anki (.apkg) · ${count} từ`;
    btn.disabled = count === 0;
    btn.title = count === 0 ? "Không có từ nào để xuất trong mục đang chọn. Hãy thêm từ hoặc chọn danh mục khác." : "";
    if (count === 0) setOpen(false);
    if (!deckNameEdited) deckName.value = suggestedName();
    hint.textContent = `File chứa ${count} từ của mục đang chọn. Sau khi tải xong: mở Anki, chọn File, Import rồi chọn file vừa tải.`;
  }

  deckName.addEventListener("input", () => {
    deckNameEdited = true;
  });
  btn.addEventListener("click", () => setOpen(!isOpen()));

  go.addEventListener("click", () => {
    if (count === 0) return;
    // Chi doi ky tu khong dung duoc trong ten file; giu nguyen chu co dau / chu Han
    const name = (deckName.value.trim() || DEFAULT_DECK_NAME).replace(/[\\/:*?"<>|]/g, "_");
    go.setAttribute("aria-busy", "true");
    window.location.href = exportUrl(name, store.libraryScope);
    setTimeout(() => {
      go.removeAttribute("aria-busy");
      setOpen(false);
    }, BUSY_MS);
  });

  document.addEventListener("click", (e) => {
    if (isOpen() && !e.target.closest(".export-wrap")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      btn.focus();
    }
  });

  return { update, close: () => setOpen(false) };
}
