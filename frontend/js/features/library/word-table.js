// Bang tu cua trang Tu vung: hien tu cua pham vi dang chon, doi danh muc ngay trong dong, nghe/sua/xoa.

import { icon } from "../../core/icons.js";
import { store } from "../../core/store.js";
import { STATUS_LABELS, childrenOf, parentsOf, wordStatus } from "../../core/word-scope.js";
import { escapeHtml } from "../../shared/dom.js";

const STATUS_BADGE = { new: "badge", learning: "badge badge-info", mature: "badge badge-success" };

// Cac lua chon danh muc cua 1 tu: "Chua phan loai" + danh muc con (nhom theo cha); selectedId duoc danh dau
function categoryOptionsHtml(selectedId) {
  let html = `<option value=""${selectedId ? "" : " selected"}>Chưa phân loại</option>`;
  parentsOf(store.categories).forEach((parent) => {
    const kids = childrenOf(store.categories, parent.id);
    if (!kids.length) return;
    html += `<optgroup label="${escapeHtml(parent.name)}">`;
    kids.forEach((child) => {
      html += `<option value="${child.id}"${child.id === selectedId ? " selected" : ""}>${escapeHtml(child.name)}</option>`;
    });
    html += "</optgroup>";
  });
  return html;
}

function rowHtml(w, selected) {
  const status = wordStatus(w);
  const name = escapeHtml(w.hanzi);
  const checked = selected.has(w.id);
  return `<tr data-id="${w.id}"${checked ? ' class="is-selected"' : ""}>
    <td class="cell-select"><input type="checkbox" data-action="select" aria-label="Chọn từ ${name}"${checked ? " checked" : ""}></td>
    <td class="cell-hanzi">${name}</td>
    <td class="cell-pinyin">${escapeHtml(w.pinyin)}</td>
    <td class="cell-meaning">${escapeHtml(w.meaning)}</td>
    <td class="cell-cat"><select class="cat-select" data-action="assign" aria-label="Danh mục của từ ${name}">${categoryOptionsHtml(w.category_id)}</select></td>
    <td class="cell-status"><span class="${STATUS_BADGE[status]}">${STATUS_LABELS[status]}</span></td>
    <td class="cell-actions"><div class="row-actions">
      <button type="button" class="btn btn-ghost btn-icon-only" data-action="play" title="Nghe" aria-label="Nghe từ ${name}">${icon("speaker")}</button>
      <button type="button" class="btn btn-ghost btn-icon-only" data-action="edit" title="Sửa" aria-label="Sửa từ ${name}">${icon("edit")}</button>
      <button type="button" class="btn btn-ghost btn-icon-only row-delete" data-action="delete" title="Xóa" aria-label="Xóa từ ${name}">${icon("trash")}</button>
    </div></td>
  </tr>`;
}

// handlers: { onPlay(word), onEdit(word), onDelete(word), onAssign(word, categoryId, selectEl),
//             onSelect(id, checked, shiftKey), onSelectAll(checked) }
export function createWordTable(rowsEl, handlers, selectAllEl) {
  let shown = [];

  function render(words, selected) {
    shown = words;
    rowsEl.innerHTML = words.map((w) => rowHtml(w, selected)).join("");
    syncSelection(selected);
  }

  // Cap nhat o chon + dong noi bat + o "chon tat ca" (trang thai mot phan) ma khong ve lai bang (giu focus ban phim)
  function syncSelection(selected) {
    rowsEl.querySelectorAll("tr").forEach((tr) => {
      const on = selected.has(tr.dataset.id);
      tr.classList.toggle("is-selected", on);
      const box = tr.querySelector('input[data-action="select"]');
      if (box) box.checked = on;
    });
    const count = shown.filter((w) => selected.has(w.id)).length;
    selectAllEl.checked = shown.length > 0 && count === shown.length;
    selectAllEl.indeterminate = count > 0 && count < shown.length;
    selectAllEl.disabled = shown.length === 0;
  }

  selectAllEl.addEventListener("click", () => handlers.onSelectAll(selectAllEl.checked));
  rowsEl.addEventListener("click", (e) => {
    const box = e.target.closest('input[data-action="select"]');
    if (box) handlers.onSelect(box.closest("tr").dataset.id, box.checked, e.shiftKey);
  });

  rowsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const word = shown.find((w) => w.id === btn.closest("tr").dataset.id);
    if (!word) return;
    const action = btn.dataset.action;
    if (action === "play") handlers.onPlay(word);
    else if (action === "edit") handlers.onEdit(word);
    else if (action === "delete") handlers.onDelete(word);
  });

  rowsEl.addEventListener("change", (e) => {
    const select = e.target.closest("select[data-action='assign']");
    if (!select) return;
    const word = shown.find((w) => w.id === select.closest("tr").dataset.id);
    if (word) handlers.onAssign(word, select.value, select);
  });

  return { render, syncSelection };
}
