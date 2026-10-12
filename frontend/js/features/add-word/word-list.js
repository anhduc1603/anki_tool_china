// Danh sach tu da luu (theo pham vi danh muc dang loc): hien thi, nghe, sua (nap vao form), xoa.

import { deleteWord, listWords } from "../../api/words-api.js";
import { playAudioForText } from "../../shared/audio.js";
import { escapeHtml } from "../../shared/dom.js";
import { state } from "./state.js";

// onEdit(word): nap tu vao form; onDeleted(id): bao form neu dang sua dung tu vua xoa;
// onRendered(): bao sau moi lan ve (de cap nhat nut xuat)
export function createWordList(els, { onEdit, onDeleted, onRendered }) {
  let requestSeq = 0; // chi lan nap moi nhat duoc ve (bo ket qua cu ve tre)

  function render() {
    const words = state.words;
    els.wordCount.textContent = `${words.length} từ`;
    els.listCount.textContent = `${words.length} từ`;
    els.wordList.innerHTML = "";
    if (words.length === 0) {
      const hint = document.createElement("p");
      hint.className = "empty-hint";
      hint.textContent = state.scope
        ? "Chưa có từ nào trong danh mục này."
        : "Chưa có từ nào. Thêm từ đầu tiên ở form phía trên nhé.";
      els.wordList.appendChild(hint);
    }
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
    onRendered();
  }

  async function refresh() {
    const seq = ++requestSeq;
    const scope = state.scope;
    const { data } = await listWords(scope);
    if (seq !== requestSeq) return;
    state.words = Array.isArray(data) ? data : [];
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
