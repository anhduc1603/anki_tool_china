// Bang danh muc kieu "deck list": cha/con, cot New/Learn/Due, nut thu gon, nut ⚙, bam ten de hoc.

import { UNCATEGORIZED } from "../../constants.js";
import { escapeHtml } from "../../shared/dom.js";
import { ZERO_COUNTS, childrenOf, parents, state } from "./state.js";

function countCells(c) {
  const v = c || ZERO_COUNTS;
  const cell = (cls, n) =>
    `<span class="deck-count ${cls}${n === 0 ? " zero" : ""}">${n}</span>`;
  return cell("count-new", v.new) + cell("count-learn", v.learn) + cell("count-due", v.due);
}

function gearButton(id) {
  return `<button type="button" class="deck-gear" data-action="gear" data-id="${id}" title="Tùy chọn" aria-label="Tùy chọn">⚙</button>`;
}

function nameCell(cat, toggleHtml, extraClass) {
  return `<span class="deck-name ${extraClass}">${toggleHtml}<button type="button" class="deck-link" data-action="study" data-scope="${cat.id}">${escapeHtml(cat.name)}</button></span>`;
}

// handlers: { onStudy(scope), onGear(buttonEl) }
export function createCategoryTable(tableEl, handlers) {
  function render() {
    const { counts, collapsed } = state;
    let html =
      '<div class="deck-row deck-head"><span>Danh mục</span><span>New</span><span>Learn</span><span>Due</span><span></span></div>';

    parents().forEach((parent) => {
      const kids = childrenOf(parent.id);
      const isCollapsed = collapsed.has(parent.id);
      const toggle = kids.length
        ? `<button type="button" class="deck-toggle" data-action="toggle" data-id="${parent.id}" aria-label="Mở/thu gọn">${isCollapsed ? "+" : "−"}</button>`
        : '<span class="deck-toggle-spacer"></span>';
      html += `<div class="deck-row deck-parent">${nameCell(parent, toggle, "")}${countCells(
        counts.categories[parent.id]
      )}${gearButton(parent.id)}</div>`;

      if (!isCollapsed) {
        kids.forEach((child) => {
          html += `<div class="deck-row deck-child">${nameCell(
            child,
            '<span class="deck-toggle-spacer"></span>',
            "deck-indent"
          )}${countCells(counts.categories[child.id])}${gearButton(child.id)}</div>`;
        });
      }
    });

    html += `<div class="deck-row deck-uncategorized"><span class="deck-name"><span class="deck-toggle-spacer"></span><button type="button" class="deck-link" data-action="study" data-scope="${UNCATEGORIZED}">Chưa phân loại</button></span>${countCells(
      counts.uncategorized
    )}<span></span></div>`;

    tableEl.innerHTML = html;
  }

  tableEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "toggle") {
      const id = btn.dataset.id;
      if (state.collapsed.has(id)) state.collapsed.delete(id);
      else state.collapsed.add(id);
      render();
    } else if (action === "study") {
      handlers.onStudy(btn.dataset.scope);
    } else if (action === "gear") {
      e.stopPropagation();
      handlers.onGear(btn);
    }
  });

  return { render };
}
