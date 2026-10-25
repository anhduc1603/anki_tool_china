// Anh goi nho va gif net viet dung chung 1 co che upload/xoa/dan/preview,
// chi khac nhau cach hien thi o mat dap an (xem preview.js).

// MIME cua anh trong clipboard thuong khong kem ten file hop le, nen phai
// tu dat ten theo MIME de backend nhan dung phan mo rong (constants/media.py: ALLOWED_IMAGE_EXT).
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

function escapeAttr(text) {
  return String(text == null ? "" : text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Dong "Anh: tac gia · giay phep · nguon" duoi anh goi nho (chi anh lay tu goi y moi co)
function renderCredit(f, credit) {
  if (!f.creditEl) return;
  const safeLink = credit && /^https?:\/\//i.test(credit.source_url || "") ? credit.source_url : "";
  if (!credit) {
    f.creditEl.classList.add("hidden");
    f.creditEl.textContent = "";
    return;
  }
  const who = escapeAttr(credit.author || "Không rõ tác giả");
  const lic = escapeAttr(credit.license || "không rõ giấy phép");
  const link = safeLink ? ` · <a href="${escapeAttr(safeLink)}" target="_blank" rel="noopener noreferrer">nguồn</a>` : "";
  f.creditEl.innerHTML = `Ảnh: ${who} · ${lic}${link}`;
  f.creditEl.classList.remove("hidden");
}

// onChange(): goi khi anh thay doi (de cap nhat preview)
export function createImageFields({ onChange }) {
  const $ = (id) => document.getElementById(id);
  const fields = {
    mnemonic: {
      input: $("mnemonic"),
      currentDiv: $("mnemonic-current"),
      removeBtn: $("remove-mnemonic-btn"),
      pasteZone: $("mnemonic-paste-zone"),
      statusEl: $("mnemonic-paste-status"),
      creditEl: $("mnemonic-credit"),
      credit: null, // nguon anh vua chon tu goi y (gui kem khi luu)
      existingCredit: null, // nguon anh da luu cua tu dang sua
      fromSuggestion: false,
      removeRequested: false,
      existingUrl: null,
      statusTimer: null,
    },
    gif: {
      input: $("gif"),
      currentDiv: $("gif-current"),
      removeBtn: $("remove-gif-btn"),
      pasteZone: $("gif-paste-zone"),
      statusEl: $("gif-paste-status"),
      credit: null,
      existingCredit: null,
      fromSuggestion: false,
      removeRequested: false,
      existingUrl: null,
      statusTimer: null,
    },
  };

  // Nguon can hien: file vua chon > anh da luu (neu chua yeu cau xoa) > khong co
  function updateCredit(f) {
    if (f.input.files && f.input.files[0]) renderCredit(f, f.credit);
    else if (!f.removeRequested && f.existingUrl) renderCredit(f, f.existingCredit);
    else renderCredit(f, null);
  }

  function reset(name) {
    const f = fields[name];
    f.removeRequested = false;
    f.existingUrl = null;
    f.credit = null;
    f.existingCredit = null;
    f.input.value = "";
    f.currentDiv.classList.add("hidden");
    updateCredit(f);
  }

  function loadFromWord(name, w) {
    const f = fields[name];
    f.removeRequested = false;
    f.input.value = "";
    f.credit = null;
    f.existingCredit = w[`${name}_credit`] || null;
    const filename = w[`${name}_filename`];
    if (filename) {
      f.existingUrl = `/media/${filename}`;
      f.currentDiv.classList.remove("hidden");
    } else {
      f.existingUrl = null;
      f.currentDiv.classList.add("hidden");
    }
    updateCredit(f);
  }

  // URL de preview: file vua chon > anh dang co (neu chua yeu cau xoa) > khong co
  function currentUrl(name) {
    const f = fields[name];
    if (f.input.files && f.input.files[0]) {
      return URL.createObjectURL(f.input.files[0]);
    }
    if (!f.removeRequested && f.existingUrl) {
      return f.existingUrl;
    }
    return null;
  }

  // Gan 1 File vao o anh nhu khi chon/dan tay; credit (neu co) la nguon cua anh goi y
  function attachFile(f, file, credit = null) {
    const dt = new DataTransfer();
    dt.items.add(file);
    f.input.files = dt.files;
    f.removeRequested = false;
    f.credit = credit;
    f.fromSuggestion = !!credit;
    f.input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  Object.values(fields).forEach((f) => {
    f.input.addEventListener("change", () => {
      if (!f.fromSuggestion) f.credit = null; // anh chon/dan tay khong co nguon
      f.fromSuggestion = false;
      f.removeRequested = false;
      updateCredit(f);
      onChange();
    });
    f.removeBtn.addEventListener("click", () => {
      f.removeRequested = true;
      f.currentDiv.classList.add("hidden");
      f.input.value = "";
      f.credit = null;
      updateCredit(f);
      onChange();
    });
    f.pasteZone.addEventListener("paste", (e) => {
      e.preventDefault();
      const item = findImageClipboardItem(e.clipboardData);
      const file = item && buildPastedImageFile(item);
      if (!file) {
        showPasteStatus(f, "Không có ảnh trong clipboard.", "error");
        return;
      }
      attachFile(f, file);
      showPasteStatus(f, "Đã dán ảnh.", "success");
    });
  });

  return {
    fields,
    currentUrl,
    // Dat anh cho o `name` tu 1 File (anh goi y); credit = { author, license, source_url }
    setFile(name, file, credit) {
      attachFile(fields[name], file, credit);
    },
    // O anh dang co anh (file moi, hoac anh da luu chua bi yeu cau xoa)?
    hasImage(name) {
      const f = fields[name];
      return !!((f.input.files && f.input.files[0]) || (!f.removeRequested && f.existingUrl));
    },
    resetAll() {
      Object.keys(fields).forEach(reset);
    },
    loadAllFromWord(w) {
      Object.keys(fields).forEach((name) => loadFromWord(name, w));
    },
    // Them file moi (hoac co xoa) vao FormData de gui len server
    appendTo(formData) {
      Object.entries(fields).forEach(([name, f]) => {
        if (f.input.files && f.input.files[0]) {
          formData.append(name, f.input.files[0]);
          if (f.credit) formData.append(`${name}_credit`, JSON.stringify(f.credit));
        } else if (f.removeRequested) {
          formData.append(`remove_${name}`, "1");
        }
      });
    },
  };
}
