// Xem truoc the Anki (mat truoc/mat sau) theo noi dung dang nhap trong form.

import { playAudioForText } from "../../shared/audio.js";

export function createPreview(els, imageFields) {
  function update() {
    const hanzi = els.hanzi.value.trim() || "你好";
    const pinyin = els.pinyin.value.trim() || "nǐ hǎo";
    const meaning = els.meaning.value.trim() || "(chưa có nghĩa)";
    const example = els.example.value.trim();

    els.pHanziFront.textContent = hanzi;
    els.pPinyinFront.textContent = pinyin;
    els.pHanziBack.textContent = hanzi;
    els.pPinyinBack.textContent = pinyin;
    els.pMeaning.textContent = meaning;
    els.pExample.textContent = example;

    const mnemonicUrl = imageFields.currentUrl("mnemonic");
    els.pMnemonic.innerHTML = mnemonicUrl ? `<img src="${mnemonicUrl}" alt="goi nho">` : "";
    imageFields.fields.mnemonic.pasteZone.classList.toggle("has-image", !!mnemonicUrl);

    const gifUrl = imageFields.currentUrl("gif");
    imageFields.fields.gif.pasteZone.classList.toggle("has-image", !!gifUrl);
    // Moi lan preview cap nhat, thu gon lai gif ve trang thai an mac dinh
    // (giong dung hanh vi that trong Anki: phai bam nut moi hien).
    els.pGif.classList.remove("open");
    els.toggleGifBtn.textContent = "✍️ Xem cách viết nét";
    if (gifUrl) {
      els.pGif.innerHTML = `<img src="${gifUrl}" alt="net viet">`;
      els.toggleGifBtn.classList.remove("hidden");
    } else {
      els.pGif.innerHTML = "";
      els.toggleGifBtn.classList.add("hidden");
    }
  }

  els.playAudioBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    playAudioForText(els.hanzi.value);
  });

  els.toggleGifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = els.pGif.classList.toggle("open");
    els.toggleGifBtn.textContent = open ? "🙈 Ẩn cách viết nét" : "✍️ Xem cách viết nét";
  });

  els.flipCard.addEventListener("click", () => {
    const flipped = els.flipCard.classList.toggle("flipped");
    els.flipTip.textContent = flipped
      ? "Bấm lại để xem mặt trước"
      : "Bấm vào thẻ để xem đáp án";
  });

  return { update };
}
