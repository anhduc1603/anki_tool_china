// Form them/sua tu: nhap lieu, nap tu de sua, luu (POST/PUT), huy sua.

import { saveWord } from "../../api/words-api.js";
import { playAudioForText } from "../../shared/audio.js";
import { state } from "./state.js";

// onSaved(): goi sau khi luu thanh cong (de nap lai danh sach)
// defaultCategory(): danh muc con chon san cho tu moi (theo bo loc danh sach); categoryLabel(): ten danh muc dang chon
export function createWordForm(els, { imageFields, preview, onSaved, defaultCategory, categoryLabel }) {
  function setMsg(text, type) {
    els.formMsg.textContent = text || "";
    els.formMsg.className = "form-msg" + (type ? " " + type : "");
  }

  // category: danh muc giu lai cho tu ke tiep (khi nhap lien tiep); bo qua -> theo bo loc danh sach
  function reset(category) {
    state.editingWordId = null;
    imageFields.resetAll();
    els.wordId.value = "";
    els.form.reset();
    els.wordCategory.value = category !== undefined ? category : defaultCategory();
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
    els.examplePinyin.value = w.example_pinyin || "";
    els.wordCategory.value = w.category_id || ""; // khong co trong danh sach option -> khong chon gi
    if (els.wordCategory.selectedIndex < 0) els.wordCategory.value = "";
    imageFields.loadAllFromWord(w);
    els.formTitle.textContent = `Đang sửa: ${w.hanzi}`;
    els.saveBtn.textContent = "Lưu thay đổi";
    els.cancelBtn.classList.remove("hidden");
    setMsg("", "");
    preview.update();
    els.hanzi.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  ["input", "change"].forEach((evt) => {
    [els.hanzi, els.pinyin, els.meaning, els.example, els.examplePinyin].forEach((el) => {
      el.addEventListener(evt, preview.update);
    });
  });

  els.listenBtn.addEventListener("click", () => playAudioForText(els.hanzi.value));
  els.cancelBtn.addEventListener("click", () => reset());

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("", "");

    const formData = new FormData();
    formData.append("hanzi", els.hanzi.value.trim());
    formData.append("pinyin", els.pinyin.value.trim());
    formData.append("meaning", els.meaning.value.trim());
    formData.append("example", els.example.value.trim());
    formData.append("example_pinyin", els.examplePinyin.value.trim());
    formData.append("category_id", els.wordCategory.value);
    imageFields.appendTo(formData);

    els.saveBtn.disabled = true;
    try {
      const editing = state.editingWordId;
      const { ok, data } = await saveWord(editing, formData);
      if (!ok) throw new Error(data.error || "Có lỗi xảy ra");

      const categoryName = categoryLabel();
      const where = categoryName ? ` (danh mục: ${categoryName})` : "";
      const message = (editing ? "Đã cập nhật từ." : "Đã lưu từ mới.") + where;
      // Them moi: giu danh muc de nhap tiep cung danh muc; sua xong: ve danh muc theo bo loc
      reset(editing ? undefined : els.wordCategory.value);
      setMsg(message, "success");
      await onSaved();
    } catch (err) {
      setMsg(err.message, "error");
    } finally {
      els.saveBtn.disabled = false;
    }
  });

  return { reset, loadWord };
}
