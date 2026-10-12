// Cac o chon danh muc cua tab Them tu moi: bo loc danh sach, truong "Danh muc" cua form va cua hop thoai CSV.

import { listCategories } from "../../api/categories-api.js";
import { UNCATEGORIZED } from "../../constants.js";
import { escapeHtml } from "../../shared/dom.js";
import { state } from "./state.js";

// els: listScope, wordCategory (form); importSelect: o chon trong hop thoai CSV.
// onScopeChange(): goi khi nguoi dung doi bo loc.
export function createCategoryOptions(els, importSelect, { onScopeChange }) {
  const parents = () => state.categories.filter((c) => c.parent_id === null);
  const childrenOf = (parent) => state.categories.filter((c) => c.parent_id === parent.id);
  const find = (id) => state.categories.find((c) => c.id === id);

  function scopeOptionsHtml() {
    let html = '<option value="">Tất cả danh mục</option>' + `<option value="${UNCATEGORIZED}">Chưa phân loại</option>`;
    parents().forEach((parent) => {
      html += `<option value="${parent.id}">${escapeHtml(parent.name)} (tất cả)</option>`;
      childrenOf(parent).forEach((child) => {
        html += `<option value="${child.id}">${escapeHtml(parent.name)} / ${escapeHtml(child.name)}</option>`;
      });
    });
    return html;
  }

  // Chi danh muc con (tu chi duoc gan vao danh muc con), nhom theo danh muc cha
  function childOptionsHtml() {
    let html = '<option value="">Chưa phân loại</option>';
    parents().forEach((parent) => {
      const children = childrenOf(parent);
      if (!children.length) return;
      html += `<optgroup label="${escapeHtml(parent.name)}">`;
      children.forEach((child) => {
        html += `<option value="${child.id}">${escapeHtml(child.name)}</option>`;
      });
      html += "</optgroup>";
    });
    return html;
  }

  // Dat lai danh sach option nhung giu gia tri cu neu con ton tai (khong thi ve mac dinh "")
  function fill(select, html) {
    const previous = select.value;
    select.innerHTML = html;
    select.value = Array.from(select.options).some((o) => o.value === previous) ? previous : "";
  }

  // Danh muc con dang loc (neu bo loc dang tro vao 1 danh muc con), ngoai ra "" (chua phan loai)
  function childOfScope() {
    const category = find(state.scope);
    return category && category.parent_id !== null ? category.id : "";
  }

  // Ten danh muc dang loc de goi y ten deck (null = dung ten mac dinh)
  function scopeName() {
    const category = find(state.scope);
    return category ? category.name : null;
  }

  // Tu theo bo loc: o danh muc cua form (khi them moi) va cua hop thoai CSV chon san danh muc con dang loc
  function followScope() {
    importSelect.value = childOfScope();
    if (!state.editingWordId) els.wordCategory.value = childOfScope();
  }

  async function load() {
    try {
      const { data } = await listCategories();
      state.categories = Array.isArray(data) ? data : [];
    } catch (err) {
      return; // giu danh sach cu: bo loc van dung duoc
    }
    fill(els.listScope, scopeOptionsHtml());
    state.scope = els.listScope.value; // gia tri khong con ton tai -> ve "Tat ca"
    fill(els.wordCategory, childOptionsHtml());
    fill(importSelect, childOptionsHtml());
  }

  els.listScope.addEventListener("change", () => {
    state.scope = els.listScope.value;
    followScope();
    onScopeChange();
  });

  return {
    load,
    scopeName,
    defaultFormCategory: childOfScope,
    categoryLabel: (select) => (select.value ? select.selectedOptions[0].textContent : ""),
  };
}
