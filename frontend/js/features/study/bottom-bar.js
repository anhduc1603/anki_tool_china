// Thanh duoi tab Hoc: bo dem New/Learn/Review (3 mau, gach chan loai the dang hien), 4 nut cham (luon hien),
// nhan "Tu chuyen the". Khong chua logic hoc: index.js noi cac nut voi hanh dong.

import { GRADES } from "../../constants.js";
import { formatInterval } from "./formatters.js";

const KINDS = [
  { kind: "new", cls: "count-new" },
  { kind: "learn", cls: "count-learn" },
  { kind: "review", cls: "count-review" },
];

export function createBottomBar() {
  const $ = (id) => document.getElementById(id);
  const els = {
    bar: $("study-bar"),
    counts: $("study-counts"),
    grades: $("study-grades"),
    gradeButtons: document.querySelectorAll("#study-grades [data-grade]"),
    editBtn: $("study-edit-btn"),
    autoLabel: $("study-auto-label"),
  };
  const timeEls = Object.fromEntries(GRADES.map((g) => [g, $(`study-time-${g}`)]));

  return {
    els,

    // counts = {new, learn, review}; currentKind = loai cua the dang hien (gach chan), undefined = khong gach
    setCounts(counts, currentKind) {
      els.counts.innerHTML = KINDS.map(({ kind, cls }) => {
        const classes = [cls, counts[kind] === 0 ? "count-zero" : "", kind === currentKind ? "is-current" : ""]
          .filter(Boolean)
          .join(" ");
        return `<span class="${classes}">${counts[kind]}</span>`;
      }).join('<span class="count-sep">+</span>');
      els.counts.setAttribute("aria-label", `Còn lại: ${counts.new} mới, ${counts.learn} đang học, ${counts.review} ôn lại`);
    },

    // The moi xuat hien: hien thanh duoi voi 4 nut cham kem thoi gian du kien (cham duoc ngay, khong can hien dap an)
    showQuestion(nextIntervals) {
      els.bar.classList.remove("hidden");
      GRADES.forEach((g) => {
        timeEls[g].textContent = formatInterval(nextIntervals[g]);
      });
    },

    hide() {
      els.bar.classList.add("hidden");
    },

    setAutoLabel(on) {
      els.autoLabel.classList.toggle("hidden", !on);
    },
  };
}
