// Danh sach tu da luu: hien thi, nghe, sua (nap vao form), xoa.

import { deleteWord, listWords } from "../../api/words-api.js";
import { playAudioForText } from "../../shared/audio.js";
import { escapeHtml } from "../../shared/dom.js";
import { state } from "./state.js";

// onEdit(word): nap tu vao form; onDeleted(id): bao form neu dang sua dung tu vua xoa
export function createWordList(els, { onEdit, onDeleted }) {
  function render() {
    const words = state.words;
    els.wordCount.textContent = `${words.length} từ`;
    els.wordList.innerHTML = "";
    if (words.length === 0) {
      els.emptyHint.classList.remove("hidden");
      return;
    }
    els.emptyHint.classList.add("hidden");
    words.forEach((w) => {
      const row = document.createElement("div");
      row.className = "word-row";
      row.innerHTML = `
        <div class="w-hanzi">${escapeHtml(w.hanzi)}</div>
        <div class="w-info">
          <div class="w-pinyin">${escapeHtml(w.pinyin)}</div>
          <div class="w-meaning">${escapeHtml(w.meaning)}</div>
        </div>
        <div class="w-actions">
          <button type="button" title="Nghe" data-action="play">🔊</button>
          <button type="button" title="Sửa" data-action="edit">✏️</button>
          <button type="button" title="Xóa" data-action="delete">🗑️</button>
        </div>
      `;
      row.querySelector('[data-action="play"]').addEventListener("click", () => {
        playAudioForText(w.hanzi);
      });
      row.querySelector('[data-action="edit"]').addEventListener("click", () => {
        onEdit(w);
      });
      row.querySelector('[data-action="delete"]').addEventListener("click", () => {
        remove(w.id);
      });
      els.wordList.appendChild(row);
    });
  }

  async function refresh() {
    const { data } = await listWords();
    state.words = data;
    render();
  }

  async function remove(id) {
    if (!confirm("Xóa từ này khỏi danh sách? Ảnh, GIF và âm thanh đính kèm của từ cũng sẽ bị xóa.")) return;
    if (await deleteWord(id)) {
      onDeleted(id);
      await refresh();
    } else {
      alert("Không xóa được từ này.");
    }
  }

  return { refresh };
}
