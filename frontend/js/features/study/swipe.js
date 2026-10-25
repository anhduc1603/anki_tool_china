// Cu chi tren man hinh hoc: cham BAT KY DAU = hien dap an, vuot phai = Good, vuot trai = Again (pointer; dung duoc ngay
// ca khi chua hien dap an). Phan biet cham / vuot ngang / cuon doc bang do dich chuyen cua con tro.
// Khong tinh cac vung dieu khien: thanh duoi, o chon pham vi, menu, thong bao, nut/lien ket/o nhap.

import { SWIPE_THRESHOLD, TAP_MAX_MOVE } from "../../constants.js";

const IGNORED = "button, a, input, textarea, select, label, .study-bar, .study-controls, .study-more-menu, .study-toast";

// areaEl: vung nhan cu chi (ca man hinh hoc); cardEl: phan tu di chuyen theo ngon tay;
// onGrade(gradeName): vuot du xa; onTap(): cham (gan nhu khong dich chuyen);
// onDrag("good" | "again" | null): phan hoi khi dang keo (keo du xa chua tha thi bao se cham gi)
export function initSwipe(areaEl, cardEl, { onGrade, onTap, onDrag }) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let feedback = null;

  function setFeedback(kind) {
    if (kind === feedback) return;
    feedback = kind;
    if (onDrag) onDrag(kind);
  }

  function reset() {
    dragging = false;
    cardEl.style.transform = "";
    setFeedback(null);
  }

  areaEl.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button > 0) return; // chi nut chinh / cham
    if (e.target instanceof Element && e.target.closest(IGNORED)) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
    setFeedback(dx > SWIPE_THRESHOLD ? "good" : dx < -SWIPE_THRESHOLD ? "again" : null);
  });

  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    reset();
    if (Math.abs(dx) <= TAP_MAX_MOVE && Math.abs(dy) <= TAP_MAX_MOVE) {
      if (onTap) onTap();
    } else if (dx > SWIPE_THRESHOLD) {
      onGrade("good");
    } else if (dx < -SWIPE_THRESHOLD) {
      onGrade("again");
    } // keo ngan hoac keo doc: chi tra the ve cho cu
  });

  // Trinh duyet lay cu chi de cuon trang: khong hien dap an, khong cham
  window.addEventListener("pointercancel", reset);
}
