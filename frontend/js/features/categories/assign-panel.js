// Panel gan tu vao danh muc: chon danh muc (hoac "Chua phan loai"), xem tu, doi danh muc tung tu.

import { assignWordCategory } from "../../api/categories-api.js";
import { UNCATEGORIZED } from "../../constants.js";
import { escapeHtml } from "../../shared/dom.js";
import { allChildren, childLabel, state } from "./state.js";

// onResult(ok, errorMessage): index.js hien thong bao va nap lai du lieu
export function createAssignPanel(scopeEl, listEl, { onResult }) {
  function assignSelect(word) {
    const options = ['<option value="">Chưa phân loại</option>']
      .concat(
        allChildren().map(
          (c) =>
            `<option value="${c.id}" ${word.category_id === c.id ? "selected" : ""}>${escapeHtml(childLabel(c))}</option>`
        )
      )
      .join("");
    return `<select data-word-id="${word.id}">${options}</select>`;
  }

  function render() {
    const previous = scopeEl.value || UNCATEGORIZED;
    scopeEl.innerHTML =
      `<option value="${UNCATEGORIZED}">Chưa phân loại</option>` +
      allChildren()
        .map((c) => `<option value="${c.id}">${escapeHtml(childLabel(c))}</option>`)
        .join("");
    const exists = Array.from(scopeEl.options).some((o) => o.value === previous);
    scopeEl.value = exists ? previous : UNCATEGORIZED;

    const scope = scopeEl.value;
    const list =
      scope === UNCATEGORIZED
        ? state.words.filter((w) => !w.category_id)
        : state.words.filter((w) => w.category_id === scope);

    listEl.innerHTML = list.length
      ? list
          .map(
            (w) => `
        <div class="cat-word-row">
          <span class="cat-word-hanzi">${escapeHtml(w.hanzi)}</span>
          <span>${escapeHtml(w.meaning)}</span>
          ${assignSelect(w)}
        </div>`
          )
          .join("")
      : '<p class="cat-empty-hint">Không có từ nào trong mục này.</p>';
  }

  scopeEl.addEventListener("change", render);

  listEl.addEventListener("change", async (e) => {
    const select = e.target.closest("select[data-word-id]");
    if (!select) return;
    const { ok, data } = await assignWordCategory(select.dataset.wordId, select.value || null);
    await onResult(ok, data.error);
  });

  return { render };
}
