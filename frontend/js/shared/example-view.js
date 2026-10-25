// Hien thi cau vi du o mat dap an: dang ruby co mau theo thanh + nut An/Hien pinyin (an mac dinh),
// hoac van ban thuong khi tu khong co pinyin vi du; kem nut loa doc ca cau (phan tieng Trung).
// Dung chung cho xem truoc va the Hoc.

import { icon } from "../core/icons.js";
import { playAudioForText } from "./audio.js";
import { renderExample, spokenText } from "./pinyin.js";

const SHOW_HTML = `${icon("eye")}Hiện pinyin`;
const HIDE_HTML = `${icon("eye-off")}Ẩn pinyin`;
const AUDIO_HTML = icon("speaker");
const BUSY_HTML = icon("refresh", { className: "icon-spin" });

export function createExampleView(exampleEl, toggleBtn, audioBtn) {
  let shown = false;
  let spoken = ""; // van ban tieng Trung se doc khi bam nut loa ("" = khong co gi de doc)
  let busy = false;

  function apply() {
    exampleEl.classList.toggle("show-pinyin", shown);
    toggleBtn.innerHTML = shown ? HIDE_HTML : SHOW_HTML;
  }

  // Bam nut loa: sinh audio neu chua co roi phat. Khong lat the, khong cham diem (nut nam ngoai the va chan noi bot).
  audioBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!spoken || busy) return;
    busy = true;
    audioBtn.disabled = true;
    audioBtn.innerHTML = BUSY_HTML;
    try {
      await playAudioForText(spoken);
    } finally {
      busy = false;
      audioBtn.disabled = false;
      audioBtn.innerHTML = AUDIO_HTML;
    }
  });

  return {
    // keepState: giu trang thai an/hien (xem truoc khi go); mac dinh moi lan hien the la an
    render(example, examplePinyin, { keepState = false } = {}) {
      if (!keepState) shown = false;
      spoken = spokenText(example);
      audioBtn.classList.toggle("hidden", !spoken);
      const html = renderExample(example, examplePinyin);
      if (html === null) {
        exampleEl.textContent = example || "";
        exampleEl.classList.remove("show-pinyin");
        toggleBtn.classList.add("hidden");
        return;
      }
      exampleEl.innerHTML = html;
      toggleBtn.classList.remove("hidden");
      apply();
    },

    toggle() {
      shown = !shown;
      apply();
    },
  };
}
