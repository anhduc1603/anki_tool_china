// Bảng xem trước CSV: từng dòng kèm trạng thái (hợp lệ / trùng / lỗi) và lý do, cùng số liệu tổng.

import { escapeHtml } from "../../../shared/dom.js";

export const STATUS_LABEL = { ok: "Hợp lệ", duplicate: "Trùng", invalid: "Lỗi" };

export function statusCell(status, label, reason) {
  return (
    `<span class="chip chip-${status}">${escapeHtml(label)}</span>` +
    (reason ? `<div class="cell-reason">${escapeHtml(reason)}</div>` : "")
  );
}

// data: { rows, summary, warnings } từ POST /api/words/import/preview
export function renderPreview(els, data) {
  const { summary } = data;
  els.summary.textContent =
    `Tổng ${summary.total} dòng: ${summary.ok} hợp lệ, ${summary.duplicate} trùng, ${summary.invalid} lỗi.`;
  els.warnings.innerHTML = data.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");

  els.tableBody.innerHTML = data.rows
    .map(
      (r) => `
      <tr class="row-${r.status}">
        <td>${r.row}</td>
        <td class="cell-hanzi">${escapeHtml(r.hanzi)}</td>
        <td>${escapeHtml(r.pinyin)}</td>
        <td>${escapeHtml(r.meaning)}</td>
        <td class="cell-example">${escapeHtml(r.example)}</td>
        <td>${statusCell(r.status, STATUS_LABEL[r.status], r.reason)}</td>
      </tr>`
    )
    .join("");

  els.startBtn.textContent = summary.ok ? `Nhập ${summary.ok} từ` : "Không có từ hợp lệ để nhập";
  els.startBtn.disabled = summary.ok === 0;
}
