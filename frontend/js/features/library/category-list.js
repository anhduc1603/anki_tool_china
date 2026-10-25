// Cay danh muc ben trai trang Tu vung (va o chon danh muc tren man hinh hep): chon pham vi, mo/thu gon cha, nut ⚙.

import { UNCATEGORIZED } from "../../constants.js";
import { store } from "../../core/store.js";
import { icon } from "../../core/icons.js";
import { childrenOf, countWords, parentsOf } from "../../core/word-scope.js";
import { escapeHtml } from "../../shared/dom.js";

// handlers: { onSelect(scope), onGear(buttonEl) }
export function createCategoryList(listEl, selectEl, handlers) {
  function itemButton(scope, name, count) {
    const current = store.libraryScope === scope;
    return `<button type="button" class="cat-item" data-action="select" data-scope="${scope}"${current ? ' aria-current="true"' : ""}>
      <span class="cat-name">${escapeHtml(name)}</span><span class="cat-count">${count}</span></button>`;
  }

  function parentRow(parent, kids, count) {
    const collapsed = store.collapsed.has(parent.id);
    const toggle = kids.length
      ? `<button type="button" class="cat-toggle" data-action="toggle" data-id="${parent.id}" aria-expanded="${!collapsed}" aria-label="${collapsed ? "Mở" : "Thu gọn"} ${escapeHtml(parent.name)}">${icon("chevron-right")}</button>`
      : '<span class="cat-toggle-spacer"></span>';
    return `<div class="cat-row is-parent">${toggle}${itemButton(parent.id, parent.name, count)}${gearButton(parent)}</div>`;
  }

  function gearButton(cat) {
    return `<button type="button" class="cat-gear" data-action="gear" data-id="${cat.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Tùy chọn danh mục ${escapeHtml(cat.name)}" title="Tùy chọn">${icon("gear")}</button>`;
  }

  function render() {
    const { categories } = store;
    const n = countWords(store.words, categories);
    let html = `<div class="cat-row">${'<span class="cat-toggle-spacer"></span>'}${itemButton("", "Tất cả từ", n.all)}</div>`;
    html += `<div class="cat-row">${'<span class="cat-toggle-spacer"></span>'}${itemButton(UNCATEGORIZED, "Chưa phân loại", n.uncategorized)}</div>`;
    if (parentsOf(categories).length) html += '<div class="cat-divider" role="separator"></div>';

    let options = `<option value="">Tất cả từ (${n.all})</option><option value="${UNCATEGORIZED}">Chưa phân loại (${n.uncategorized})</option>`;
    parentsOf(categories).forEach((parent) => {
      const kids = childrenOf(categories, parent.id);
      html += parentRow(parent, kids, n.byCategory[parent.id]);
      options += `<option value="${parent.id}">${escapeHtml(parent.name)} - tất cả (${n.byCategory[parent.id]})</option>`;
      kids.forEach((child) => {
        options += `<option value="${child.id}">${escapeHtml(parent.name)} / ${escapeHtml(child.name)} (${n.byCategory[child.id]})</option>`;
        if (!store.collapsed.has(parent.id)) {
          html += `<div class="cat-row is-child"><span class="cat-toggle-spacer"></span>${itemButton(child.id, child.name, n.byCategory[child.id])}${gearButton(child)}</div>`;
        }
      });
    });
    listEl.innerHTML = html;
    selectEl.innerHTML = options;
    selectEl.value = store.libraryScope;
  }

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "select") handlers.onSelect(btn.dataset.scope);
    else if (action === "toggle") {
      const id = btn.dataset.id;
      if (store.collapsed.has(id)) store.collapsed.delete(id);
      else store.collapsed.add(id);
      render();
    } else if (action === "gear") {
      e.stopPropagation();
      handlers.onGear(btn);
    }
  });
  selectEl.addEventListener("change", () => handlers.onSelect(selectEl.value));

  return { render };
}
