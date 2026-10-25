// O "Danh muc" cua form them/sua tu: chi danh muc con (nhom theo cha); chon san theo pham vi trang Tu vung.

import { store } from "../../core/store.js";
import { allChildren, childrenOf, parentsOf } from "../../core/word-scope.js";
import { escapeHtml } from "../../shared/dom.js";

export function createCategorySelect(selectEl) {
  function optionsHtml() {
    let html = '<option value="">Chưa phân loại</option>';
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

  // Danh muc con dang chon o trang Tu vung (neu co), ngoai ra "" (chua phan loai)
  function defaultCategory() {
    const scoped = allChildren(store.categories).find((c) => c.id === store.libraryScope);
    return scoped ? scoped.id : "";
  }

  // Dat lai danh sach lua chon nhung giu gia tri dang chon neu con ton tai
  function refresh() {
    const previous = selectEl.value;
    selectEl.innerHTML = optionsHtml();
    selectEl.value = Array.from(selectEl.options).some((o) => o.value === previous) ? previous : "";
  }

  return { refresh, defaultCategory };
}
