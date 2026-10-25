// Menu ⚙ cua moi danh muc: Doi ten / Them danh muc con (chi danh muc cha) / Xoa.

import { store } from "../../core/store.js";

// onAction(action, category): action la "rename" | "add-child" | "delete"
export function createGearMenu(menuEl, { onAction }) {
  let target = null;
  let opener = null;

  function close({ restoreFocus = false } = {}) {
    menuEl.classList.add("hidden");
    if (opener) {
      opener.setAttribute("aria-expanded", "false");
      if (restoreFocus && opener.isConnected) opener.focus();
    }
    target = null;
    opener = null;
  }

  function open(btn) {
    const cat = store.categories.find((c) => c.id === btn.dataset.id);
    if (!cat) return;
    target = cat;
    opener = btn;
    btn.setAttribute("aria-expanded", "true");
    menuEl.setAttribute("role", "menu");
    menuEl.innerHTML =
      '<button type="button" role="menuitem" data-menu="rename">Đổi tên</button>' +
      (cat.parent_id === null ? '<button type="button" role="menuitem" data-menu="add-child">Thêm danh mục con</button>' : "") +
      '<button type="button" role="menuitem" data-menu="delete" class="danger">Xóa</button>';
    const rect = btn.getBoundingClientRect();
    menuEl.style.top = `${rect.bottom + 4}px`;
    menuEl.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    menuEl.classList.remove("hidden");
    menuEl.querySelector("button").focus();
  }

  function toggle(btn) {
    if (target && target.id === btn.dataset.id) close();
    else {
      close();
      open(btn);
    }
  }

  menuEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-menu]");
    if (!btn || !target) return;
    const cat = target;
    close({ restoreFocus: true });
    onAction(btn.dataset.menu, cat);
  });

  // Phim mui ten di chuyen giua cac muc
  menuEl.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(menuEl.querySelectorAll("button"));
    const i = items.indexOf(document.activeElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next].focus();
    e.preventDefault();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#gear-menu") && !e.target.closest(".cat-gear")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && target) close({ restoreFocus: true });
  });
  window.addEventListener("scroll", () => close(), true);

  return { toggle, close };
}
