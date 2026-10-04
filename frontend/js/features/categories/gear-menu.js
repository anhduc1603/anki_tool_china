// Menu ⚙ cua moi dong danh muc: Doi ten / Them danh muc con (chi danh muc cha) / Xoa.

import { state } from "./state.js";

// onAction(action, category): action la "rename" | "add-child" | "delete"
export function createGearMenu(menuEl, { onAction }) {
  let target = null;

  function close() {
    menuEl.classList.add("hidden");
    target = null;
  }

  function open(btn) {
    const cat = state.categories.find((c) => c.id === btn.dataset.id);
    if (!cat) return;
    target = cat;
    menuEl.innerHTML =
      '<button type="button" data-menu="rename">Đổi tên</button>' +
      (cat.parent_id === null
        ? '<button type="button" data-menu="add-child">Thêm danh mục con</button>'
        : "") +
      '<button type="button" data-menu="delete" class="danger">Xóa</button>';
    const rect = btn.getBoundingClientRect();
    menuEl.style.top = `${rect.bottom + 4}px`;
    menuEl.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    menuEl.classList.remove("hidden");
  }

  function toggle(btn) {
    if (target && target.id === btn.dataset.id) close();
    else open(btn);
  }

  menuEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-menu]");
    if (!btn || !target) return;
    const cat = target;
    close();
    onAction(btn.dataset.menu, cat);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#gear-menu") && !e.target.closest(".deck-gear")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  window.addEventListener("scroll", close, true);

  return { toggle, close };
}
