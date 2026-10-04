// Form them/sua tu: nhap lieu, nap tu de sua, luu (POST/PUT), huy sua.

import { saveWord } from "../../api/words-api.js";
import { playAudioForText } from "../../shared/audio.js";
import { state } from "./state.js";

// onSaved(): goi sau khi luu thanh cong (de nap lai danh sach)
export function createWordForm(els, { imageFields, preview, onSaved }) {
  function setMsg(text, type) {
    els.formMsg.textContent = text || "";
    els.formMsg.className = "form-msg" + (type ? " " + type : "");
  }

  function reset() {
    state.editingWordId = null;
    imageFields.resetAll();
    els.wordId.value = "";
    els.form.reset();
    els.formTitle.textContent = "Thêm từ mới";
    els.saveBtn.textContent = "Lưu từ";
    els.cancelBtn.classList.add("hidden");
    setMsg("", "");
    preview.update();
  }

  function loadWord(w) {
    state.editingWordId = w.id;
    els.wordId.value = w.id;
    els.hanzi.value = w.hanzi;
    els.pinyin.value = w.pinyin;
    els.meaning.value = w.meaning;
    els.example.value = w.example || "";
    imageFields.loadAllFromWord(w);
    els.formTitle.textContent = `Đang sửa: ${w.hanzi}`;
    els.saveBtn.textContent = "Lưu thay đổi";
    els.cancelBtn.classList.remove("hidden");
    setMsg("", "");
    preview.update();
    els.hanzi.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  ["input", "change"].forEach((evt) => {
    [els.hanzi, els.pinyin, els.meaning, els.example].forEach((el) => {
      el.addEventListener(evt, preview.update);
    });
  });

  els.listenBtn.addEventListener("click", () => playAudioForText(els.hanzi.value));
  els.cancelBtn.addEventListener("click", reset);

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("", "");

    const formData = new FormData();
    formData.append("hanzi", els.hanzi.value.trim());
    formData.append("pinyin", els.pinyin.value.trim());
    formData.append("meaning", els.meaning.value.trim());
    formData.append("example", els.example.value.trim());
    imageFields.appendTo(formData);

    els.saveBtn.disabled = true;
    try {
      const editing = state.editingWordId;
      const { ok, data } = await saveWord(editing, formData);
      if (!ok) throw new Error(data.error || "Có lỗi xảy ra");

      setMsg(editing ? "Đã cập nhật từ." : "Đã lưu từ mới.", "success");
      reset();
      await onSaved();
    } catch (err) {
      setMsg(err.message, "error");
    } finally {
      els.saveBtn.disabled = false;
    }
  });

  return { reset, loadWord };
}
