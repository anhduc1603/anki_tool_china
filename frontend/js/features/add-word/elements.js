// Cac phan tu DOM cua tab Them tu moi (tra cuu 1 lan, truyen cho cac module con).

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
    saveBtn: $("save-btn"),
    cancelBtn: $("cancel-edit-btn"),
    formMsg: $("form-msg"),
    listenBtn: $("listen-btn"),
    wordList: $("word-list"),
    emptyHint: $("empty-hint"),
    wordCount: $("word-count"),
    deckName: $("deck-name"),
    exportBtn: $("export-btn"),
    flipCard: $("flip-card"),
    flipTip: $("flip-tip"),
    pHanziFront: $("p-hanzi-front"),
    pPinyinFront: $("p-pinyin-front"),
    pHanziBack: $("p-hanzi-back"),
    pPinyinBack: $("p-pinyin-back"),
    pMeaning: $("p-meaning"),
    pExample: $("p-example"),
    pMnemonic: $("p-mnemonic"),
    pGif: $("p-gif"),
    toggleGifBtn: $("toggle-gif-btn"),
    playAudioBtn: $("play-audio-btn"),
  };
}
