// Hien thi cau vi du o mat dap an: dang ruby co mau theo thanh + nut An/Hien pinyin (an mac dinh),
// hoac van ban thuong khi tu khong co pinyin vi du; kem nut 🔊 doc ca cau (phan tieng Trung).
// Dung chung cho xem truoc va the Hoc.

import { playAudioForText } from "./audio.js";
import { renderExample, spokenText } from "./pinyin.js";

const SHOW_TEXT = "🔤 Hiện pinyin";
const HIDE_TEXT = "🙈 Ẩn pinyin";
const AUDIO_ICON = "🔊";
const BUSY_ICON = "⏳";

export function createExampleView(exampleEl, toggleBtn, audioBtn) {
  let shown = false;
  let spoken = ""; // van ban tieng Trung se doc khi bam 🔊 ("" = khong co gi de doc)
  let busy = false;

  function apply() {
    exampleEl.classList.toggle("show-pinyin", shown);
    toggleBtn.textContent = shown ? HIDE_TEXT : SHOW_TEXT;
  }

  // Bam 🔊: sinh audio neu chua co roi phat. Khong lat the, khong cham diem (nut nam ngoai the va chan noi bot).
  audioBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!spoken || busy) return;
    busy = true;
    audioBtn.disabled = true;
    audioBtn.textContent = BUSY_ICON;
    try {
      await playAudioForText(spoken);
    } finally {
      busy = false;
      audioBtn.disabled = false;
      audioBtn.textContent = AUDIO_ICON;
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
