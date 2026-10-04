// Báo cáo cuối: số liệu từng loại và lý do của từng dòng không được tạo.

import { escapeHtml } from "../../../shared/dom.js";
import { statusCell } from "./preview-view.js";

const LABEL = {
  created: "Đã tạo",
  duplicate: "Trùng",
  invalid: "Lỗi",
  failed: "Không lưu được",
  skipped: "Chưa xử lý",
};

// previewRows: tất cả dòng từ xem trước; outcome: kết quả của runImport()
export function renderReport(els, previewRows, outcome) {
  const byRow = new Map(outcome.results.map((r) => [r.row, r]));
  const notProcessed = new Set(outcome.notProcessed);
  const counts = { created: 0, duplicate: 0, invalid: 0, failed: 0, skipped: 0 };
  const lines = [];

  for (const p of previewRows) {
    let status;
    let reason = p.reason || "";
    if (p.status === "duplicate" || p.status === "invalid") {
      status = p.status; // đã bị loại ở bước xem trước, không gửi lên server
    } else if (byRow.has(p.row)) {
      const r = byRow.get(p.row);
      status = r.status;
      reason = r.reason || "";
    } else if (notProcessed.has(p.row)) {
      status = "skipped";
      reason = outcome.cancelled ? "Đã hủy trước khi xử lý dòng này." : "Chưa xử lý do lỗi ở trên.";
    } else {
      continue;
    }
    counts[status] += 1;
    if (status !== "created") lines.push({ ...p, status, reason });
  }

  els.stats.innerHTML = Object.keys(counts)
    .filter((k) => k === "created" || counts[k] > 0)
    .map((k) => `<span class="chip chip-${k}">${LABEL[k]}: ${counts[k]}</span>`)
    .join("");

  const notes = [];
  if (outcome.cancelled) notes.push("Bạn đã hủy giữa chừng; các từ đã lưu vẫn được giữ.");
  if (outcome.error) notes.push("Dừng do lỗi: " + outcome.error);
  els.note.textContent = notes.join(" ");

  els.tableBody.innerHTML = lines.length
    ? lines
        .map(
          (r) => `
      <tr class="row-${r.status}">
        <td>${r.row}</td>
        <td class="cell-hanzi">${escapeHtml(r.hanzi)}</td>
        <td>${statusCell(r.status, LABEL[r.status], "")}</td>
        <td class="cell-reason">${escapeHtml(r.reason)}</td>
      </tr>`
        )
        .join("")
    : '<tr><td colspan="4">Tất cả các dòng đã được tạo.</td></tr>';

  return counts;
}
