// Giao dien tab Hoc (kieu Anki): the (cau hoi tren, dap an hien ngay duoi), trang thai cho/het tu, thong bao nho.
// Thanh duoi (bo dem, nut) nam o bottom-bar.js.

import { icon } from "../../core/icons.js";
import { renderWordPinyin } from "../../shared/pinyin.js";
import { createExampleView } from "../../shared/example-view.js";

const TOAST_MS = 3200;

export function createStudyView() {
  const $ = (id) => document.getElementById(id);
  const els = {
    area: $("tab-study"),
    scopeFilter: $("study-category-filter"),
    empty: $("study-empty"),
    buriedNote: $("study-buried-note"),
    buriedText: $("study-buried-text"),
    unburyBtn: $("study-unbury-btn"),
    waiting: $("study-waiting"),
    waitTime: $("study-wait-time"),
    cardWrap: $("study-card-wrap"),
    card: $("study-card"),
    hanziFront: $("study-hanzi-front"),
    pinyinFront: $("study-pinyin-front"),
    playAudioBtn: $("study-play-audio-btn"),
    typeWrap: $("study-type"),
    typeInput: $("study-type-input"),
    answer: $("study-a"),
    anchor: $("study-answer-anchor"),
    typeResult: $("study-type-result"),
    meaning: $("study-meaning"),
    example: $("study-example"),
    togglePinyinBtn: $("study-toggle-pinyin-btn"),
    exampleAudioBtn: $("study-example-audio-btn"),
    hint: $("study-hint"),
    mnemonic: $("study-mnemonic"),
    toggleGifBtn: $("study-toggle-gif-btn"),
    gif: $("study-gif"),
    toast: $("study-toast"),
  };

  const exampleView = createExampleView(els.example, els.togglePinyinBtn, els.exampleAudioBtn);
  let toastTimer = null;
  els.answer.addEventListener("animationend", (e) => {
    if (e.target === els.answer) els.answer.classList.remove("flip-open");
  });

  // Cho anh gon (mnemonic/GIF) tai xong toi da `maxMs` de cuon toi dap an khong bi lech khi anh nay ra
  function imagesSettled(maxMs) {
    const pending = Array.from(els.answer.querySelectorAll("img")).filter((img) => !img.complete);
    if (!pending.length) return Promise.resolve();
    const loaded = Promise.all(
      pending.map((img) => new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }))
    );
    return Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, maxMs))]);
  }

  return {
    els,

    // Khong co the nao de hoc ngay: hien "dang cho" (waiting = true) hoac "het tu"
    showNoCard({ waiting }) {
      els.cardWrap.classList.add("hidden");
      els.empty.classList.toggle("hidden", waiting);
      els.waiting.classList.toggle("hidden", !waiting);
      els.buriedNote.classList.add("hidden");
    },

    // Man "het tu": bao so tu dang hoan den mai kem nut Bo hoan (count = 0 -> an)
    setBuriedNote(count) {
      els.buriedNote.classList.toggle("hidden", !(count > 0));
      if (count > 0) els.buriedText.textContent = `Có ${count} từ đã hoãn đến ngày mai.`;
    },

    setCountdown(text) {
      els.waitTime.textContent = text;
    },

    // Hien cau hoi cua the (chua hien dap an). typeAnswer: che do go pinyin (an pinyin, hien o go).
    showCard(word, { typeAnswer = false } = {}) {
      els.empty.classList.add("hidden");
      els.waiting.classList.add("hidden");
      els.cardWrap.classList.remove("hidden");

      els.hanziFront.textContent = word.hanzi;
      els.pinyinFront.innerHTML = renderWordPinyin(word.pinyin);
      els.pinyinFront.classList.toggle("hidden", typeAnswer);
      els.typeWrap.classList.toggle("hidden", !typeAnswer);
      els.typeInput.value = "";
      els.typeInput.disabled = false;

      // Dap an dung san (an) de hien tuc thi khi can
      els.meaning.textContent = word.meaning;
      exampleView.render(word.example, word.example_pinyin); // pinyin an moi khi sang the moi
      els.mnemonic.innerHTML = word.mnemonic_filename
        ? `<img src="/media/${word.mnemonic_filename}" alt="goi nho">`
        : "";
      els.gif.classList.remove("open");
      if (word.gif_filename) {
        els.gif.innerHTML = `<img src="/media/${word.gif_filename}" alt="net viet">`;
        els.toggleGifBtn.classList.remove("hidden");
        els.toggleGifBtn.innerHTML = `${icon("edit")}Xem cách viết nét`;
      } else {
        els.gif.innerHTML = "";
        els.toggleGifBtn.classList.add("hidden");
      }

      els.answer.classList.remove("flip-open");
      els.answer.classList.add("hidden");
      els.hint.classList.remove("hidden");
      els.area.classList.add("answer-hidden");
      delete els.card.dataset.swipe;
      delete els.card.dataset.swipeLabel;
      els.typeResult.classList.add("hidden");
      els.typeResult.innerHTML = "";
      els.card.style.transform = "";
      window.scrollTo(0, 0);
      if (typeAnswer && document.visibilityState === "visible") els.typeInput.focus({ preventScroll: true });
    },

    // Hien dap an ngay duoi cau hoi (khoi dap an lat mo xuong, cau hoi dung yen), khoa o go va cuon toi dap an
    showAnswer({ typeResultHtml = null } = {}) {
      els.typeInput.disabled = true;
      els.typeInput.blur();
      if (typeResultHtml !== null) {
        els.typeResult.innerHTML = typeResultHtml;
        els.typeResult.classList.remove("hidden");
        els.pinyinFront.classList.add("hidden");
      }
      els.answer.classList.remove("hidden");
      els.answer.classList.add("flip-open");
      els.hint.classList.add("hidden");
      els.area.classList.remove("answer-hidden");
      imagesSettled(300).then(() => {
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        els.anchor.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      });
    },

    // Phan hoi khi keo the: "good" | "again" | null (dat thuoc tinh de CSS ve vien va nhan)
    setSwipeFeedback(kind) {
      if (kind) {
        els.card.dataset.swipe = kind;
        els.card.dataset.swipeLabel = kind === "good" ? "Good" : "Again";
      } else {
        delete els.card.dataset.swipe;
        delete els.card.dataset.swipeLabel;
      }
    },

    getTypedText() {
      return els.typeInput.value;
    },

    toggleExamplePinyin() {
      exampleView.toggle();
    },

    toggleGif() {
      const open = els.gif.classList.toggle("open");
      els.toggleGifBtn.innerHTML = open ? `${icon("eye-off")}Ẩn cách viết nét` : `${icon("edit")}Xem cách viết nét`;
    },

    // Thong bao nho o giua phia tren thanh duoi, tu mo sau vai giay
    toast(text) {
      els.toast.textContent = text;
      els.toast.classList.remove("hidden");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => els.toast.classList.add("hidden"), TOAST_MS);
    },
  };
}
