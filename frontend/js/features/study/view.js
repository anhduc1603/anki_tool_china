// Giao dien tab Hoc: cac phan tu DOM va cac trang thai hien thi (the / dang cho / het tu).

import { GRADES } from "../../constants.js";
import { formatInterval } from "./formatters.js";

export function createStudyView() {
  const els = {
    scopeFilter: document.getElementById("study-category-filter"),
    remaining: document.getElementById("study-remaining"),
    empty: document.getElementById("study-empty"),
    waiting: document.getElementById("study-waiting"),
    waitTime: document.getElementById("study-wait-time"),
    cardWrap: document.getElementById("study-card-wrap"),
    flipCard: document.getElementById("study-flip-card"),
    hanziFront: document.getElementById("study-hanzi-front"),
    pinyinFront: document.getElementById("study-pinyin-front"),
    playAudioBtn: document.getElementById("study-play-audio-btn"),
    hanziBack: document.getElementById("study-hanzi-back"),
    pinyinBack: document.getElementById("study-pinyin-back"),
    meaning: document.getElementById("study-meaning"),
    example: document.getElementById("study-example"),
    mnemonic: document.getElementById("study-mnemonic"),
    toggleGifBtn: document.getElementById("study-toggle-gif-btn"),
    gif: document.getElementById("study-gif"),
    bar: document.getElementById("study-bar"),
    showBtn: document.getElementById("study-show-btn"),
    grades: document.getElementById("study-grades"),
    gradeButtons: document.querySelectorAll("#study-grades [data-grade]"),
  };

  const timeEls = Object.fromEntries(
    GRADES.map((g) => [g, document.getElementById(`study-time-${g}`)])
  );

  return {
    els,

    setRemaining(text) {
      els.remaining.textContent = text;
    },

    // Khong co the nao de hoc ngay: hien "dang cho" (waiting = true) hoac "het tu"
    showNoCard({ waiting }) {
      els.cardWrap.classList.add("hidden");
      els.bar.classList.add("hidden");
      els.empty.classList.toggle("hidden", waiting);
      els.waiting.classList.toggle("hidden", !waiting);
    },

    setCountdown(text) {
      els.waitTime.textContent = text;
    },

    // Hien mat truoc cua the (chua lat) kem nhan thoi gian tren 4 nut cham diem
    showCard(word) {
      els.empty.classList.add("hidden");
      els.waiting.classList.add("hidden");
      els.cardWrap.classList.remove("hidden");
      els.bar.classList.remove("hidden");

      els.hanziFront.textContent = word.hanzi;
      els.pinyinFront.textContent = word.pinyin;
      els.hanziBack.textContent = word.hanzi;
      els.pinyinBack.textContent = word.pinyin;
      els.meaning.textContent = word.meaning;
      els.example.textContent = word.example || "";
      els.mnemonic.innerHTML = word.mnemonic_filename
        ? `<img src="/media/${word.mnemonic_filename}" alt="goi nho">`
        : "";

      els.gif.classList.remove("open");
      if (word.gif_filename) {
        els.gif.innerHTML = `<img src="/media/${word.gif_filename}" alt="net viet">`;
        els.toggleGifBtn.classList.remove("hidden");
        els.toggleGifBtn.textContent = "✍️ Xem cách viết nét";
      } else {
        els.gif.innerHTML = "";
        els.toggleGifBtn.classList.add("hidden");
      }

      GRADES.forEach((g) => {
        timeEls[g].textContent = formatInterval(word.next_intervals[g]);
      });

      els.flipCard.classList.remove("flipped");
      els.flipCard.style.transform = "";
      els.showBtn.classList.remove("hidden");
      els.grades.classList.add("hidden");
    },

    // Lat the: hien mat sau va 4 nut cham diem
    showAnswer() {
      els.flipCard.classList.add("flipped");
      els.showBtn.classList.add("hidden");
      els.grades.classList.remove("hidden");
    },

    toggleGif() {
      const open = els.gif.classList.toggle("open");
      els.toggleGifBtn.textContent = open ? "🙈 Ẩn cách viết nét" : "✍️ Xem cách viết nét";
    },
  };
}
