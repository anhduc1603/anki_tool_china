// Phim tat cua phien hoc (kieu Anki): Space/Enter hien dap an roi cham Good, 1-4 cham ngay, R nghe lai,
// Shift+A bat/tat tu chuyen the, "-" hoan the, E sua tu. Khong tranh phim voi o nhap, tab khac, hop thoai, menu.

// actions: { isActive, isBlocked, hasCard, isRevealed, reveal, grade, replay, toggleAuto, bury, edit }
export function initShortcuts(actions) {
  const GRADE_BY_KEY = { 1: "again", 2: "hard", 3: "good", 4: "easy" };

  document.addEventListener("keydown", (e) => {
    if (!actions.isActive() || actions.isBlocked()) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const target = e.target;
    if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
    if (document.querySelector("dialog[open]")) return;
    if (!actions.hasCard()) return;

    const key = e.key;
    // Space/Enter khi nut dang focus: de nut tu xu ly (tranh kich hoat 2 lan)
    if ((key === " " || key === "Enter") && target instanceof Element && target.closest("button, a")) return;

    if (key === " " || key === "Enter") {
      e.preventDefault();
      if (actions.isRevealed()) actions.grade("good");
      else actions.reveal();
    } else if (GRADE_BY_KEY[key] && !e.shiftKey) {
      e.preventDefault();
      actions.grade(GRADE_BY_KEY[key]); // cham ngay, khong can hien dap an
    } else if ((key === "r" || key === "R") && !e.shiftKey) {
      e.preventDefault();
      actions.replay();
    } else if (key === "A" && e.shiftKey) {
      e.preventDefault();
      actions.toggleAuto();
    } else if (key === "-" && !e.shiftKey) {
      e.preventDefault();
      actions.bury();
    } else if ((key === "e" || key === "E") && !e.shiftKey) {
      e.preventDefault();
      actions.edit();
    }
  });
}
