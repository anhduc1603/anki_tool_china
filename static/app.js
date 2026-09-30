(() => {
  const els = {
    form: document.getElementById("word-form"),
    formTitle: document.getElementById("form-title"),
    wordId: document.getElementById("word-id"),
    hanzi: document.getElementById("hanzi"),
    pinyin: document.getElementById("pinyin"),
    meaning: document.getElementById("meaning"),
    example: document.getElementById("example"),
    saveBtn: document.getElementById("save-btn"),
    cancelBtn: document.getElementById("cancel-edit-btn"),
    formMsg: document.getElementById("form-msg"),
    listenBtn: document.getElementById("listen-btn"),
    wordList: document.getElementById("word-list"),
    emptyHint: document.getElementById("empty-hint"),
    wordCount: document.getElementById("word-count"),
    deckName: document.getElementById("deck-name"),
    exportBtn: document.getElementById("export-btn"),
    flipCard: document.getElementById("flip-card"),
    flipTip: document.getElementById("flip-tip"),
    audioPlayer: document.getElementById("audio-player"),
    pHanziFront: document.getElementById("p-hanzi-front"),
    pPinyinFront: document.getElementById("p-pinyin-front"),
    pHanziBack: document.getElementById("p-hanzi-back"),
    pPinyinBack: document.getElementById("p-pinyin-back"),
    pMeaning: document.getElementById("p-meaning"),
    pExample: document.getElementById("p-example"),
    pMnemonic: document.getElementById("p-mnemonic"),
    pGif: document.getElementById("p-gif"),
    toggleGifBtn: document.getElementById("toggle-gif-btn"),
    playAudioBtn: document.getElementById("play-audio-btn"),
  };

  // Anh goi nho va gif net viet dung chung 1 co che upload/xoa/preview,
  // chi khac nhau cach hien thi o mat dap an.
  const imageFields = {
    mnemonic: {
      input: document.getElementById("mnemonic"),
      currentDiv: document.getElementById("mnemonic-current"),
      removeBtn: document.getElementById("remove-mnemonic-btn"),
      pasteZone: document.getElementById("mnemonic-paste-zone"),
      statusEl: document.getElementById("mnemonic-paste-status"),
      removeRequested: false,
      existingUrl: null,
      statusTimer: null,
    },
    gif: {
      input: document.getElementById("gif"),
      currentDiv: document.getElementById("gif-current"),
      removeBtn: document.getElementById("remove-gif-btn"),
      pasteZone: document.getElementById("gif-paste-zone"),
      statusEl: document.getElementById("gif-paste-status"),
      removeRequested: false,
      existingUrl: null,
      statusTimer: null,
    },
  };

  // MIME cua anh trong clipboard thuong khong kem ten file hop le, nen phai
  // tu dat ten theo MIME de backend nhan dung phan mo rong (ALLOWED_IMAGE_EXT).
  const CLIPBOARD_MIME_EXT = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };

  function findImageClipboardItem(clipboardData) {
    if (!clipboardData || !clipboardData.items) return null;
    for (const item of clipboardData.items) {
      if (item.kind === "file" && item.type && item.type.startsWith("image/")) {
        return item;
      }
    }
    return null;
  }

  function buildPastedImageFile(item) {
    const blob = item.getAsFile();
    if (!blob) return null;
    const ext = CLIPBOARD_MIME_EXT[item.type] || "png";
    return new File([blob], `pasted.${ext}`, { type: item.type || "image/png" });
  }

  function showPasteStatus(f, text, type) {
    f.statusEl.textContent = text;
    f.statusEl.className = "paste-status" + (type ? " " + type : "");
    if (f.statusTimer) clearTimeout(f.statusTimer);
    f.statusTimer = setTimeout(() => {
      f.statusEl.textContent = "";
      f.statusEl.className = "paste-status";
    }, 2500);
  }

  let words = [];
  let editingWordId = null;

  function setMsg(text, type) {
    els.formMsg.textContent = text || "";
    els.formMsg.className = "form-msg" + (type ? " " + type : "");
  }

  async function fetchWords() {
    const res = await fetch("/api/words");
    words = await res.json();
    renderWordList();
  }

  function renderWordList() {
    els.wordCount.textContent = `${words.length} từ`;
    els.wordList.innerHTML = "";
    if (words.length === 0) {
      els.emptyHint.classList.remove("hidden");
      return;
    }
    els.emptyHint.classList.add("hidden");
    words.forEach((w) => {
      const row = document.createElement("div");
      row.className = "word-row";
      row.innerHTML = `
        <div class="w-hanzi">${escapeHtml(w.hanzi)}</div>
        <div class="w-info">
          <div class="w-pinyin">${escapeHtml(w.pinyin)}</div>
          <div class="w-meaning">${escapeHtml(w.meaning)}</div>
        </div>
        <div class="w-actions">
          <button type="button" title="Nghe" data-action="play">🔊</button>
          <button type="button" title="Sửa" data-action="edit">✏️</button>
          <button type="button" title="Xóa" data-action="delete">🗑️</button>
        </div>
      `;
      row.querySelector('[data-action="play"]').addEventListener("click", () => {
        playAudioForText(w.hanzi);
      });
      row.querySelector('[data-action="edit"]').addEventListener("click", () => {
        loadWordIntoForm(w);
      });
      row.querySelector('[data-action="delete"]').addEventListener("click", () => {
        deleteWord(w.id);
      });
      els.wordList.appendChild(row);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function resetImageField(name) {
    const f = imageFields[name];
    f.removeRequested = false;
    f.existingUrl = null;
    f.input.value = "";
    f.currentDiv.classList.add("hidden");
  }

  function loadImageFieldFromWord(name, w) {
    const f = imageFields[name];
    f.removeRequested = false;
    f.input.value = "";
    const filename = w[`${name}_filename`];
    if (filename) {
      f.existingUrl = `/media/${filename}`;
      f.currentDiv.classList.remove("hidden");
    } else {
      f.existingUrl = null;
      f.currentDiv.classList.add("hidden");
    }
  }

  function currentImageUrl(name) {
    const f = imageFields[name];
    if (f.input.files && f.input.files[0]) {
      return URL.createObjectURL(f.input.files[0]);
    }
    if (!f.removeRequested && f.existingUrl) {
      return f.existingUrl;
    }
    return null;
  }

  function resetForm() {
    editingWordId = null;
    resetImageField("mnemonic");
    resetImageField("gif");
    els.wordId.value = "";
    els.form.reset();
    els.formTitle.textContent = "Thêm từ mới";
    els.saveBtn.textContent = "Lưu từ";
    els.cancelBtn.classList.add("hidden");
    setMsg("", "");
    updatePreview();
  }

  function loadWordIntoForm(w) {
    editingWordId = w.id;
    els.wordId.value = w.id;
    els.hanzi.value = w.hanzi;
    els.pinyin.value = w.pinyin;
    els.meaning.value = w.meaning;
    els.example.value = w.example || "";
    loadImageFieldFromWord("mnemonic", w);
    loadImageFieldFromWord("gif", w);
    els.formTitle.textContent = `Đang sửa: ${w.hanzi}`;
    els.saveBtn.textContent = "Lưu thay đổi";
    els.cancelBtn.classList.remove("hidden");
    setMsg("", "");
    updatePreview();
    els.hanzi.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteWord(id) {
    if (!confirm("Xóa từ này khỏi danh sách?")) return;
    const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingWordId === id) resetForm();
      await fetchWords();
    } else {
      alert("Không xóa được từ này.");
    }
  }

  function updatePreview() {
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

    const mnemonicUrl = currentImageUrl("mnemonic");
    els.pMnemonic.innerHTML = mnemonicUrl ? `<img src="${mnemonicUrl}" alt="goi nho">` : "";
    imageFields.mnemonic.pasteZone.classList.toggle("has-image", !!mnemonicUrl);

    const gifUrl = currentImageUrl("gif");
    imageFields.gif.pasteZone.classList.toggle("has-image", !!gifUrl);
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

  async function playAudioForText(text) {
    if (!text || !text.trim()) return;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi sinh audio");
      els.audioPlayer.src = data.audio_url;
      await els.audioPlayer.play();
    } catch (err) {
      alert("Không phát được âm thanh: " + err.message);
    }
  }

  // ---- Events ----

  ["input", "change"].forEach((evt) => {
    [els.hanzi, els.pinyin, els.meaning, els.example].forEach((el) => {
      el.addEventListener(evt, updatePreview);
    });
  });

  Object.entries(imageFields).forEach(([name, f]) => {
    f.input.addEventListener("change", () => {
      f.removeRequested = false;
      updatePreview();
    });
    f.removeBtn.addEventListener("click", () => {
      f.removeRequested = true;
      f.currentDiv.classList.add("hidden");
      f.input.value = "";
      updatePreview();
    });
    f.pasteZone.addEventListener("paste", (e) => {
      e.preventDefault();
      const item = findImageClipboardItem(e.clipboardData);
      const file = item && buildPastedImageFile(item);
      if (!file) {
        showPasteStatus(f, "Không có ảnh trong clipboard.", "error");
        return;
      }
      const dt = new DataTransfer();
      dt.items.add(file);
      f.input.files = dt.files;
      f.removeRequested = false;
      f.input.dispatchEvent(new Event("change", { bubbles: true }));
      showPasteStatus(f, "Đã dán ảnh.", "success");
    });
  });

  els.listenBtn.addEventListener("click", () => playAudioForText(els.hanzi.value));
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

  els.cancelBtn.addEventListener("click", resetForm);

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("", "");

    const formData = new FormData();
    formData.append("hanzi", els.hanzi.value.trim());
    formData.append("pinyin", els.pinyin.value.trim());
    formData.append("meaning", els.meaning.value.trim());
    formData.append("example", els.example.value.trim());

    Object.entries(imageFields).forEach(([name, f]) => {
      if (f.input.files && f.input.files[0]) {
        formData.append(name, f.input.files[0]);
      } else if (f.removeRequested) {
        formData.append(`remove_${name}`, "1");
      }
    });

    els.saveBtn.disabled = true;
    try {
      const url = editingWordId ? `/api/words/${editingWordId}` : "/api/words";
      const method = editingWordId ? "PUT" : "POST";
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");

      setMsg(editingWordId ? "Đã cập nhật từ." : "Đã lưu từ mới.", "success");
      resetForm();
      await fetchWords();
    } catch (err) {
      setMsg(err.message, "error");
    } finally {
      els.saveBtn.disabled = false;
    }
  });

  els.exportBtn.addEventListener("click", () => {
    if (words.length === 0) {
      alert("Danh sách từ đang trống. Hãy thêm ít nhất 1 từ trước khi xuất file.");
      return;
    }
    const deckName = (els.deckName.value.trim() || "MyChineseDeck").replace(/[^\w\-]/g, "_");
    window.location.href = `/api/export?deck_name=${encodeURIComponent(deckName)}`;
  });

  // ---- Init ----
  updatePreview();
  fetchWords();
})();
