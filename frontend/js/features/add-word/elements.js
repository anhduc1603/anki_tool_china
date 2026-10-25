// Cac phan tu DOM cua trang Them / sua tu (tra cuu 1 lan, truyen cho cac module con).

export function queryElements() {
  const $ = (id) => document.getElementById(id);
  return {
    form: $("word-form"),
    formTitle: $("form-title"),
    wordId: $("word-id"),
    hanzi: $("hanzi"),
    pinyin: $("pinyin"),
    meaning: $("meaning"),
    example: $("example"),
    examplePinyin: $("example-pinyin"),
    saveBtn: $("save-btn"),
    cancelBtn: $("cancel-edit-btn"),
    formMsg: $("form-msg"),
    listenBtn: $("listen-btn"),
    wordCategory: $("word-category"),
    flipCard: $("flip-card"),
    flipTip: $("flip-tip"),
    pHanziFront: $("p-hanzi-front"),
    pPinyinFront: $("p-pinyin-front"),
    pHanziBack: $("p-hanzi-back"),
    pPinyinBack: $("p-pinyin-back"),
    pMeaning: $("p-meaning"),
    pExample: $("p-example"),
    togglePinyinBtn: $("toggle-pinyin-btn"),
    exampleAudioBtn: $("example-audio-btn"),
    pMnemonic: $("p-mnemonic"),
    pGif: $("p-gif"),
    toggleGifBtn: $("toggle-gif-btn"),
    playAudioBtn: $("play-audio-btn"),
  };
}
