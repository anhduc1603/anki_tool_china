// Che do "go dap an": dung HTML ket qua so sanh pinyin da go voi pinyin dung (xanh = dung, do = sai, xam = thieu).
// Chi de tham khao, khong cham diem. Phan so khop nam o shared/pinyin.js (comparePinyin).

import { icon } from "../../core/icons.js";
import { comparePinyin, escapeText } from "../../shared/pinyin.js";

function spansHtml(entries) {
  return entries
    .map((e) => (e.state === "neutral" ? escapeText(e.ch) : `<span class="type-${e.state}">${escapeText(e.ch)}</span>`))
    .join("");
}

// Khop hoan toan: 1 dong xanh voi pinyin dung (day du dau thanh). Nguoc lai: dong da go, mui ten, dong pinyin dung.
export function renderTypeResult(typed, expected) {
  const result = comparePinyin(typed, expected);
  if (result.full) return `<div class="type-line">${spansHtml(result.expected)}</div>`;
  const typedLine = typed && typed.trim()
    ? `<div class="type-line">${spansHtml(result.typed)}</div>`
    : '<div class="type-line type-empty">(chưa gõ gì)</div>';
  return `${typedLine}<div class="type-arrow" aria-hidden="true">${icon("chevron-down")}</div><div class="type-line">${spansHtml(result.expected)}</div>`;
}
