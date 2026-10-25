// Form them/sua tu: kiem tra, nap tu de sua, luu (POST/PUT), huy sua; bao ket qua bang thong bao.

import { saveWord } from "../../api/words-api.js";
import { EVENTS, TAB_IDS } from "../../constants.js";
import { emit } from "../../core/events.js";
import { store } from "../../core/store.js";
import { toast } from "../../core/toast.js";
import { playAudioForText } from "../../shared/audio.js";

const REQUIRED = [
  { key: "hanzi", error: "hanzi-error", message: "Vui lòng nhập chữ Hán." },
  { key: "pinyin", error: "pinyin-error", message: "Vui lòng nhập pinyin." },
  { key: "meaning", error: "meaning-error", message: "Vui lòng nhập nghĩa tiếng Việt." },
];

// onSaved(): goi sau khi luu thanh cong (nap lai du lieu cac trang)
// defaultCategory(): danh muc con chon san cho tu moi (theo pham vi dang chon o trang Tu vung)
// onReset(word): form vua duoc dat lai (word = null) hoac nap 1 tu de sua (cho phan goi y anh dat lai trang thai)
export function createWordForm(els, { imageFields, preview, onSaved, defaultCategory, onReset }) {
  const $ = (id) => document.getElementById(id);
  const subtitle = $("form-subtitle");
  const backBtn = $("add-back-btn");

  function setMsg(text, type) {
    els.formMsg.textContent = text || "";
    els.formMsg.className = "form-msg" + (type ? " " + type : "");
  }

  function clearErrors() {
    REQUIRED.forEach(({ key, error }) => {
      $(error).classList.add("hidden");
      $(error).textContent = "";
      els[key].removeAttribute("aria-invalid");
    });
  }

  // Tra ve o dau tien thieu (da danh dau loi) hoac null neu hop le
  function validate() {
    clearErrors();
    let first = null;
    REQUIRED.forEach(({ key, error, message }) => {
      if (els[key].value.trim()) return;
      $(error).textContent = message;
      $(error).classList.remove("hidden");
      els[key].setAttribute("aria-invalid", "true");
      if (!first) first = els[key];
    });
    return first;
  }

  // Che do them moi / sua: tieu de, dong phu, nut huy, nut ve Tu vung, ten trang tren thanh tren cung
  function setMode(word) {
    els.formTitle.textContent = word ? "Sửa từ" : "Thêm từ mới";
    subtitle.textContent = word ? `Đang sửa: ${word.hanzi}` : "";
    subtitle.classList.toggle("hidden", !word);
    els.saveBtn.textContent = word ? "Lưu thay đổi" : "Lưu từ";
    els.cancelBtn.classList.toggle("hidden", !word);
    backBtn.classList.toggle("hidden", !word);
    emit(EVENTS.PAGE_TITLE_OVERRIDE, { tabId: TAB_IDS.ADD, title: word ? "Sửa từ" : null });
  }

  // category: danh muc giu lai cho tu ke tiep (khi nhap lien tiep); bo qua -> theo pham vi trang Tu vung
  function reset(category) {
    store.editingWord = null;
    imageFields.resetAll();
    els.wordId.value = "";
    els.form.reset();
    els.wordCategory.value = category !== undefined ? category : defaultCategory();
    setMode(null);
    setMsg("", "");
    clearErrors();
    preview.update();
    onReset(null);
  }

  function loadWord(w) {
    store.editingWord = w;
    els.wordId.value = w.id;
    els.hanzi.value = w.hanzi;
    els.pinyin.value = w.pinyin;
    els.meaning.value = w.meaning;
    els.example.value = w.example || "";
    els.examplePinyin.value = w.example_pinyin || "";
    els.wordCategory.value = w.category_id || ""; // khong co trong danh sach option -> khong chon gi
    if (els.wordCategory.selectedIndex < 0) els.wordCategory.value = "";
    imageFields.loadAllFromWord(w);
    setMode(w);
    setMsg("", "");
    clearErrors();
    preview.update();
    onReset(w);
    window.scrollTo(0, 0);
  }

  ["input", "change"].forEach((evt) => {
    [els.hanzi, els.pinyin, els.meaning, els.example, els.examplePinyin].forEach((el) => {
      el.addEventListener(evt, preview.update);
    });
  });
  REQUIRED.forEach(({ key, error }) => {
    els[key].addEventListener("input", () => {
      $(error).classList.add("hidden");
      els[key].removeAttribute("aria-invalid");
    });
  });

  els.listenBtn.addEventListener("click", () => playAudioForText(els.hanzi.value));
  els.cancelBtn.addEventListener("click", () => reset());

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("", "");
    const invalid = validate();
    if (invalid) {
      setMsg("Vui lòng điền các trường bắt buộc.", "error");
      invalid.focus();
      return;
    }

    const formData = new FormData();
    formData.append("hanzi", els.hanzi.value.trim());
    formData.append("pinyin", els.pinyin.value.trim());
    formData.append("meaning", els.meaning.value.trim());
    formData.append("example", els.example.value.trim());
    formData.append("example_pinyin", els.examplePinyin.value.trim());
    formData.append("category_id", els.wordCategory.value);
    imageFields.appendTo(formData);

    els.saveBtn.disabled = true;
    els.saveBtn.setAttribute("aria-busy", "true");
    try {
      const editing = store.editingWord;
      const { ok, data } = await saveWord(editing ? editing.id : null, formData);
      if (!ok) throw new Error(data.error || "Có lỗi xảy ra");

      const hanzi = els.hanzi.value.trim();
      const categoryId = els.wordCategory.value;
      const categoryText = categoryId ? els.wordCategory.selectedOptions[0].textContent : "";
      const where = categoryText ? ` (danh mục: ${categoryText})` : "";
      const message = `${editing ? "Đã cập nhật" : "Đã lưu"} "${hanzi}"${where}.`;
      // Them moi: giu danh muc de nhap tiep cung danh muc; sua xong: ve danh muc theo pham vi trang Tu vung
      reset(editing ? undefined : categoryId);
      setMsg(message, "success");
      toast.success(message, {
        action: {
          label: "Xem trong Từ vựng",
          onClick: () => {
            if (!editing) store.libraryScope = categoryId;
            emit(EVENTS.ACTIVATE_TAB, { tabId: TAB_IDS.LIBRARY });
          },
        },
      });
      els.hanzi.focus();
      await onSaved();
    } catch (err) {
      setMsg(err.message, "error");
      toast.error(err.message);
    } finally {
      els.saveBtn.disabled = false;
      els.saveBtn.removeAttribute("aria-busy");
    }
  });

  return { reset, loadWord };
}
