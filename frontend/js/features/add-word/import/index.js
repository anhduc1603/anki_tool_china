// Hộp thoại nhập hàng loạt từ CSV: nhập liệu + prompt -> xem trước -> nhập từng lô -> báo cáo.

import { previewImport } from "../../../api/words-api.js";
import { IMPORT_MAX_BYTES } from "../../../constants.js";
import { buildPrompt, copyPrompt } from "./prompt.js";
import { renderPreview } from "./preview-view.js";
import { renderReport } from "./report-view.js";
import { runImport } from "./run-import.js";

const STEPS = ["input", "preview", "running", "report"];

// onImported(): gọi khi đóng hộp thoại sau khi đã tạo được từ (để nạp lại danh sách từ)
export function initImport({ onImported }) {
  const $ = (id) => document.getElementById(id);
  const els = {
    dialog: $("import-dialog"),
    openBtn: $("import-open-btn"),
    closeBtn: $("import-close-btn"),
    steps: Object.fromEntries(STEPS.map((s) => [s, $(`import-step-${s}`)])),
    words: $("import-words"),
    copyBtn: $("import-copy-btn"),
    copyMsg: $("import-copy-msg"),
    promptText: $("import-prompt-text"),
    csv: $("import-csv"),
    file: $("import-file"),
    previewBtn: $("import-preview-btn"),
    inputMsg: $("import-input-msg"),
    backBtn: $("import-back-btn"),
    startBtn: $("import-start-btn"),
    cancelBtn: $("import-cancel-btn"),
    doneBtn: $("import-done-btn"),
    progress: $("import-progress"),
    progressText: $("import-progress-text"),
    preview: {
      summary: $("import-summary"),
      warnings: $("import-warnings"),
      tableBody: document.querySelector("#import-table tbody"),
      startBtn: $("import-start-btn"),
    },
    report: {
      stats: $("import-stats"),
      note: $("import-report-note"),
      tableBody: document.querySelector("#import-report-table tbody"),
    },
  };

  const state = { step: "input", previewData: null, cancelRequested: false, createdSinceRefresh: 0, finished: false };

  function showStep(name) {
    state.step = name;
    STEPS.forEach((s) => els.steps[s].classList.toggle("hidden", s !== name));
    els.closeBtn.disabled = name === "running";
    els.dialog.querySelector(".import-body").scrollTop = 0;
  }

  function setMsg(el, text, type) {
    el.textContent = text || "";
    el.className = "form-msg" + (type ? " " + type : "");
  }

  // ---- Mở / đóng ----

  function open() {
    if (state.finished) {
      // Lần nhập trước đã xong: bắt đầu lại từ đầu
      els.csv.value = "";
      els.words.value = "";
      els.file.value = "";
      state.previewData = null;
      state.finished = false;
    }
    refreshPromptText();
    setMsg(els.inputMsg, "", "");
    setMsg(els.copyMsg, "", "");
    showStep("input");
    els.dialog.showModal();
  }

  // Nạp lại danh sách từ nếu đã tạo thêm từ (gọi ở mọi đường đóng; lần gọi thứ hai không làm gì)
  function flushRefresh() {
    if (state.createdSinceRefresh > 0) {
      state.createdSinceRefresh = 0;
      onImported();
    }
  }

  function closeDialog() {
    els.dialog.close();
    flushRefresh();
  }

  els.openBtn.addEventListener("click", open);
  els.closeBtn.addEventListener("click", () => {
    if (state.step !== "running") closeDialog();
  });
  els.doneBtn.addEventListener("click", closeDialog);

  // Esc khi đang nhập: không đóng (tránh mất báo cáo), phải bấm Hủy
  els.dialog.addEventListener("cancel", (e) => {
    if (state.step === "running") e.preventDefault();
  });

  els.dialog.addEventListener("close", () => {
    // Trình duyệt vẫn có thể đóng hộp thoại khi bấm Esc liên tiếp: mở lại nếu đang nhập
    if (state.step === "running") {
      els.dialog.showModal();
      return;
    }
    flushRefresh(); // đóng bằng Esc/đường khác của trình duyệt
  });

  // ---- Bước 1: prompt ----

  function refreshPromptText() {
    els.promptText.value = buildPrompt(els.words.value);
  }
  els.words.addEventListener("input", refreshPromptText);

  els.copyBtn.addEventListener("click", async () => {
    refreshPromptText();
    const result = await copyPrompt(els.promptText.value, els.promptText);
    if (result === "ok") setMsg(els.copyMsg, "Đã sao chép prompt. Dán vào AI để lấy CSV.", "success");
    else setMsg(els.copyMsg, "Không tự sao chép được: hãy chọn và sao chép nội dung prompt bên dưới.", "error");
  });

  // ---- Bước 2: dán / chọn file, xem trước ----

  els.file.addEventListener("change", async () => {
    const file = els.file.files[0];
    if (!file) return;
    if (file.size > IMPORT_MAX_BYTES) {
      setMsg(els.inputMsg, "File lớn hơn 1 MB, vượt quá giới hạn cho phép.", "error");
      els.file.value = "";
      return;
    }
    try {
      els.csv.value = await file.text();
      setMsg(els.inputMsg, `Đã nạp file "${file.name}". Bấm Xem trước để kiểm tra.`, "success");
    } catch (err) {
      setMsg(els.inputMsg, "Không đọc được file: " + err.message, "error");
    }
    els.file.value = ""; // cho phép chọn lại cùng một file
  });

  els.previewBtn.addEventListener("click", async () => {
    if (!els.csv.value.trim()) {
      setMsg(els.inputMsg, "Hãy dán nội dung CSV hoặc chọn file CSV trước.", "error");
      return;
    }
    els.previewBtn.disabled = true;
    setMsg(els.inputMsg, "Đang kiểm tra...", "");
    try {
      const { ok, data } = await previewImport(els.csv.value);
      if (!ok) {
        setMsg(els.inputMsg, data.error || "Không xem trước được CSV.", "error");
        return;
      }
      state.previewData = data;
      renderPreview(els.preview, data);
      setMsg(els.inputMsg, "", "");
      showStep("preview");
    } catch (err) {
      setMsg(els.inputMsg, "Mất kết nối tới server: " + err.message, "error");
    } finally {
      els.previewBtn.disabled = false;
    }
  });

  els.backBtn.addEventListener("click", () => showStep("input"));

  // ---- Bước 3-4: nhập, tiến trình, hủy, báo cáo ----

  els.startBtn.addEventListener("click", async () => {
    const data = state.previewData;
    if (!data) return;
    const rows = data.rows.filter((r) => r.status === "ok");
    if (!rows.length) return;

    state.cancelRequested = false;
    els.cancelBtn.disabled = false;
    els.cancelBtn.textContent = "Hủy";
    showStep("running");

    const outcome = await runImport(rows, {
      isCancelled: () => state.cancelRequested,
      onProgress: (done, total) => {
        els.progress.max = total;
        els.progress.value = done;
        els.progressText.textContent = `Đã xử lý ${done}/${total} từ...`;
      },
    });

    const counts = renderReport(els.report, data.rows, outcome);
    state.createdSinceRefresh += counts.created;
    state.finished = true;
    showStep("report");
  });

  els.cancelBtn.addEventListener("click", () => {
    state.cancelRequested = true;
    els.cancelBtn.disabled = true;
    els.cancelBtn.textContent = "Đang hủy...";
  });
}
