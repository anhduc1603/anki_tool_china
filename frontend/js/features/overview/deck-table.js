// Bang bo the (deck list) o trang Tong quan: cha/con, cot Moi/Dang hoc/On lai, nut thu gon, bam ten de hoc.
// Chi de hoc: khong co nut quan ly danh muc (viec do o trang Tu vung).

import { UNCATEGORIZED } from "../../constants.js";
import { icon } from "../../core/icons.js";
import { store } from "../../core/store.js";
import { ZERO_COUNTS, childrenOf, parentsOf } from "../../core/word-scope.js";
import { escapeHtml } from "../../shared/dom.js";

function countCells(c) {
  const v = c || ZERO_COUNTS;
  const cell = (cls, n) => `<span class="deck-count ${cls}${n === 0 ? " zero" : ""}">${n}</span>`;
  return cell("count-new", v.new) + cell("count-learn", v.learn) + cell("count-due", v.due);
}

function nameCell(cat, toggleHtml, extraClass) {
  return `<span class="deck-name ${extraClass}">${toggleHtml}<button type="button" class="deck-link" data-action="study" data-scope="${cat.id}">${escapeHtml(cat.name)}</button></span>`;
}

// handlers: { onStudy(scope) }
export function createDeckTable(tableEl, handlers) {
  function render() {
    const { counts, categories, collapsed } = store;
    let html =
      '<div class="deck-row deck-head" role="presentation"><span>Danh mục</span><span>Mới</span><span>Đang học</span><span>Ôn lại</span></div>';

    parentsOf(categories).forEach((parent) => {
      const kids = childrenOf(categories, parent.id);
      const isCollapsed = collapsed.has(parent.id);
      const toggle = kids.length
        ? `<button type="button" class="deck-toggle" data-action="toggle" data-id="${parent.id}" aria-expanded="${!isCollapsed}" aria-label="${isCollapsed ? "Mở" : "Thu gọn"} ${escapeHtml(parent.name)}">${icon("chevron-right")}</button>`
        : '<span class="deck-toggle-spacer"></span>';
      html += `<div class="deck-row deck-parent">${nameCell(parent, toggle, "")}${countCells(counts.categories[parent.id])}</div>`;
      if (!isCollapsed) {
        kids.forEach((child) => {
          html += `<div class="deck-row deck-child">${nameCell(child, '<span class="deck-toggle-spacer"></span>', "deck-indent")}${countCells(counts.categories[child.id])}</div>`;
        });
      }
    });

    html += `<div class="deck-row deck-uncategorized"><span class="deck-name"><span class="deck-toggle-spacer"></span><button type="button" class="deck-link" data-action="study" data-scope="${UNCATEGORIZED}">Chưa phân loại</button></span>${countCells(counts.uncategorized)}</div>`;
    tableEl.innerHTML = html;
  }

  tableEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "toggle") {
      const id = btn.dataset.id;
      if (store.collapsed.has(id)) store.collapsed.delete(id);
      else store.collapsed.add(id);
      render();
    } else if (btn.dataset.action === "study") {
      handlers.onStudy(btn.dataset.scope);
    }
  });

  return { render };
}
