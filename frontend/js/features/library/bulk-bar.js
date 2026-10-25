// Thanh thao tac khi chon nhieu tu o trang Tu vung: so tu da chon, danh muc dich, Chuyen, Bo chon.

import { store } from "../../core/store.js";
import { childrenOf, parentsOf } from "../../core/word-scope.js";
import { escapeHtml } from "../../shared/dom.js";

export const BULK_UNCATEGORIZED = "uncategorized"; // gia tri rieng cho "Chua phan loai" (khac "" = chua chon dich)

// handlers: { onApply(destination: id | null), onClear() }
export function createBulkBar(handlers) {
  const $ = (id) => document.getElementById(id);
  const bar = $("lib-bulk-bar");
  const countEl = $("lib-bulk-count");
  const select = $("lib-bulk-category");
  const applyBtn = $("lib-bulk-apply");
  const clearBtn = $("lib-bulk-clear");

  function optionsHtml() {
    let html = `<option value="">Chuyển vào danh mục…</option><option value="${BULK_UNCATEGORIZED}">Chưa phân loại</option>`;
    parentsOf(store.categories).forEach((parent) => {
      const kids = childrenOf(store.categories, parent.id);
      if (!kids.length) return;
      html += `<optgroup label="${escapeHtml(parent.name)}">`;
      kids.forEach((child) => {
        html += `<option value="${child.id}">${escapeHtml(child.name)}</option>`;
      });
      html += "</optgroup>";
    });
    return html;
  }

  function syncApply() {
    applyBtn.disabled = !select.value || applyBtn.getAttribute("aria-busy") === "true";
  }

  select.addEventListener("change", syncApply);
  clearBtn.addEventListener("click", () => handlers.onClear());
  applyBtn.addEventListener("click", () => {
    if (!select.value || applyBtn.getAttribute("aria-busy") === "true") return;
    handlers.onApply(select.value === BULK_UNCATEGORIZED ? null : select.value);
  });

  return {
    // count: so tu dang chon; hien thanh khi count > 0
    update(count) {
      const previous = select.value;
      select.innerHTML = optionsHtml();
      select.value = Array.from(select.options).some((o) => o.value === previous) ? previous : "";
      countEl.textContent = `Đã chọn ${count} từ`;
      bar.classList.toggle("hidden", count === 0);
      syncApply();
    },
    setBusy(busy) {
      if (busy) applyBtn.setAttribute("aria-busy", "true");
      else applyBtn.removeAttribute("aria-busy");
      syncApply();
    },
    // Ten danh muc dich dang chon (cho thong bao)
    destinationLabel() {
      return select.value ? select.selectedOptions[0].textContent : "";
    },
  };
}
