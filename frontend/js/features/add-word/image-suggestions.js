// Goi y anh minh hoa cho o "Anh goi nho": tim tren kho anh mien phi (qua server), hien vai anh de nguoi dung chon.
// Khong bao gio tu gan anh: chi khi nguoi dung bam chon thi anh moi vao o anh (nhu anh dan tay).

import { downloadSuggestedImage, searchImages, suggestedImageUrl } from "../../api/images-api.js";
import { store } from "../../core/store.js";
import { toast } from "../../core/toast.js";
import { escapeHtml } from "../../shared/dom.js";
import { keywordFromMeaning } from "./keyword.js";

const SOURCES = ["commons", "openverse"]; // Commons nhanh va la nguon chinh; Openverse cham nen chi de bo sung
const MIN_RESULTS_BEFORE_EXTRA = 4;
const MAX_SHOWN = 6;
const MIME_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };

export function createImageSuggestions(els, imageFields) {
  const $ = (id) => document.getElementById(id);
  const keywordEl = $("image-keyword");
  const searchBtn = $("image-search-btn");
  const statusEl = $("image-search-status");
  const listEl = $("image-suggestions");

  let keywordEdited = false; // nguoi dung tu sua o tu khoa -> khong ghi de theo nghia
  let lastSearched = ""; // tu khoa da tim trong form nay (khong tu tim lai)
  let seq = 0; // chi lan tim moi nhat duoc ve
  let shown = [];

  function setStatus(text) {
    statusEl.textContent = text || "";
  }

  function render() {
    listEl.innerHTML = shown
      .map(
        (r) => `<button type="button" class="image-thumb" data-token="${r.token}" title="${escapeHtml(r.title)} - ${escapeHtml(r.credit_text)}" aria-label="Chọn ảnh: ${escapeHtml(r.title || "không tên")}">
          <img src="${suggestedImageUrl(r.token)}" alt=""><span>${escapeHtml(r.title || "Ảnh")}</span></button>`
      )
      .join("");
  }

  // Them ket qua moi (bo trung theo token/tieu de), toi da MAX_SHOWN; khong xao tron anh da hien
  function addResults(results) {
    const titles = new Set(shown.map((r) => (r.title || "").toLowerCase()));
    for (const r of results) {
      if (shown.length >= MAX_SHOWN) break;
      const key = (r.title || "").toLowerCase();
      if (key && titles.has(key)) continue;
      titles.add(key);
      shown.push(r);
    }
    render();
  }

  async function runSource(source, keyword) {
    try {
      const { ok, data } = await searchImages(keyword, source);
      if (!ok) return { status: "error", results: [] };
      return { status: data.status, results: data.results || [] };
    } catch (err) {
      return { status: "error", results: [] };
    }
  }

  async function search(keyword) {
    const mine = ++seq;
    lastSearched = keyword.toLowerCase();
    shown = [];
    render();
    searchBtn.setAttribute("aria-busy", "true");
    setStatus("Đang tìm ảnh…");
    const statuses = [];
    try {
      for (const source of SOURCES) {
        if (source !== SOURCES[0] && shown.length >= MIN_RESULTS_BEFORE_EXTRA) break; // du ngay tu nguon nhanh
        if (source !== SOURCES[0]) setStatus("Đang tìm thêm ảnh…");
        const result = await runSource(source, keyword);
        if (mine !== seq) return; // co lan tim moi hon (hoac form da reset)
        statuses.push(result.status);
        addResults(result.results);
      }
    } finally {
      if (mine === seq) searchBtn.removeAttribute("aria-busy");
    }
    if (shown.length) {
      setStatus("Bấm vào một ảnh để dùng làm ảnh gợi nhớ, hoặc bỏ qua.");
    } else if (statuses.every((s) => s === "ok")) {
      setStatus("Không tìm thấy ảnh phù hợp. Thử từ khóa khác, ví dụ từ tiếng Anh.");
    } else {
      lastSearched = ""; // loi: cho phep tu tim lai sau
      setStatus("Tạm thời không tìm được ảnh (mạng hoặc kho ảnh đang bận). Bấm \"Tìm ảnh minh hoạ\" để thử lại; vẫn dán hoặc chọn ảnh thủ công được.");
    }
  }

  async function choose(button) {
    const result = shown.find((r) => r.token === button.dataset.token);
    if (!result) return;
    listEl.querySelectorAll("button").forEach((b) => (b.disabled = true));
    setStatus("Đang tải ảnh…");
    const { ok, blob, error } = await downloadSuggestedImage(result.token);
    if (!ok) {
      toast.error(error);
      listEl.querySelectorAll("button").forEach((b) => (b.disabled = false));
      setStatus("Chọn ảnh khác hoặc tìm lại.");
      return;
    }
    const ext = MIME_EXT[blob.type] || "jpg";
    imageFields.setFile("mnemonic", new File([blob], `suggested.${ext}`, { type: blob.type || "image/jpeg" }), result.credit);
    shown = [];
    render();
    seq += 1; // bo qua ket qua tim dang cho (neu co)
    setStatus("Đã chọn ảnh. Bấm \"Lưu từ\" để lưu cùng từ.");
  }

  // Tu khoa theo nghia (tru khi nguoi dung da tu sua)
  els.meaning.addEventListener("input", () => {
    if (!keywordEdited) keywordEl.value = keywordFromMeaning(els.meaning.value);
  });
  keywordEl.addEventListener("input", () => {
    keywordEdited = keywordEl.value.trim() !== "";
    if (!keywordEdited) keywordEl.value = keywordFromMeaning(els.meaning.value);
  });

  searchBtn.addEventListener("click", () => {
    const keyword = keywordEl.value.trim();
    if (!keyword) {
      setStatus("Hãy nhập từ khóa để tìm ảnh.");
      keywordEl.focus();
      return;
    }
    search(keyword);
  });
  listEl.addEventListener("click", (e) => {
    const button = e.target.closest("button.image-thumb");
    if (button && !button.disabled) choose(button);
  });

  // Roi o nghia cua TU MOI chua co anh: tu tim (khong bao gio tu gan anh)
  els.meaning.addEventListener("blur", () => {
    if (store.editingWord || imageFields.hasImage("mnemonic")) return;
    const keyword = keywordEl.value.trim();
    if (!keyword || keyword.toLowerCase() === lastSearched) return;
    search(keyword);
  });

  return {
    // Goi khi form reset (word = null) hoac nap 1 tu de sua: xoa ket qua, dat lai tu khoa theo nghia
    reset(word) {
      seq += 1;
      searchBtn.removeAttribute("aria-busy");
      shown = [];
      render();
      setStatus("");
      keywordEdited = false;
      lastSearched = "";
      keywordEl.value = keywordFromMeaning(word ? word.meaning : els.meaning.value);
    },
  };
}
