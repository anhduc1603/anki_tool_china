// Menu "Them" o thanh duoi: Hoan the, Nghe lai, Tu chuyen the (co dau tich khi bat). Mo len tren vi nam sat day.

import { icon } from "../../core/icons.js";

export function createMoreMenu({ onBury, onReplay, onToggleAuto }) {
  const $ = (id) => document.getElementById(id);
  const btn = $("study-more-btn");
  const menu = $("study-more-menu");
  const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
  const actions = { bury: onBury, replay: onReplay, auto: onToggleAuto };

  const isOpen = () => !menu.classList.contains("hidden");

  function close({ restoreFocus = false } = {}) {
    if (!isOpen()) return;
    menu.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
    if (restoreFocus) btn.focus();
  }

  function open() {
    menu.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
    items[0].focus();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isOpen()) close();
    else open();
  });

  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
      actions[item.dataset.action]();
    });
  });

  // Bam ra ngoai thi dong, khong lam gi
  document.addEventListener("click", (e) => {
    if (isOpen() && !menu.contains(e.target) && e.target !== btn) close();
  });

  // Escape dong; mui ten len/xuong di chuyen giua cac muc
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close({ restoreFocus: true });
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const idx = items.indexOf(document.activeElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(idx + step + items.length) % items.length].focus();
    }
  });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      close({ restoreFocus: true });
    }
  });

  return {
    isOpen,
    close,
    // Dau tich cua muc "Tu chuyen the"
    setAutoChecked(on) {
      const auto = menu.querySelector('[data-action="auto"]');
      auto.setAttribute("aria-checked", String(on));
      auto.querySelector(".menu-check").innerHTML = on ? icon("check") : "";
    },
  };
}
