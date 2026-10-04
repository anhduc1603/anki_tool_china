// Quet the sang phai = Good, sang trai = Again (pointer drag, chi khi the da lat).

import { SWIPE_THRESHOLD } from "../../constants.js";

// isFlipped(): the da lat chua; onGrade(gradeName): goi khi quet du xa
export function initSwipe(cardEl, { isFlipped, onGrade }) {
  let dragging = false;
  let dragStartX = 0;

  cardEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    if (!isFlipped()) return;
    dragging = true;
    dragStartX = e.clientX;
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
  });

  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - dragStartX;
    cardEl.style.transform = "";
    if (dx > SWIPE_THRESHOLD) {
      onGrade("good");
    } else if (dx < -SWIPE_THRESHOLD) {
      onGrade("again");
    }
  });

  window.addEventListener("pointercancel", () => {
    dragging = false;
    cardEl.style.transform = "";
  });
}
