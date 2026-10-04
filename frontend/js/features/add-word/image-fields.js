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
      removeRequested: false,
      existingUrl: null,
      statusTimer: null,
    },
  };

  function reset(name) {
    const f = fields[name];
    f.removeRequested = false;
    f.existingUrl = null;
    f.input.value = "";
    f.currentDiv.classList.add("hidden");
  }

  function loadFromWord(name, w) {
    const f = fields[name];
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

  Object.values(fields).forEach((f) => {
    f.input.addEventListener("change", () => {
      f.removeRequested = false;
      onChange();
    });
    f.removeBtn.addEventListener("click", () => {
      f.removeRequested = true;
      f.currentDiv.classList.add("hidden");
      f.input.value = "";
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
      const dt = new DataTransfer();
      dt.items.add(file);
      f.input.files = dt.files;
      f.removeRequested = false;
      f.input.dispatchEvent(new Event("change", { bubbles: true }));
      showPasteStatus(f, "Đã dán ảnh.", "success");
    });
  });

  return {
    fields,
    currentUrl,
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
        } else if (f.removeRequested) {
          formData.append(`remove_${name}`, "1");
        }
      });
    },
  };
}
