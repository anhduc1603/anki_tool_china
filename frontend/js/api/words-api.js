import { getJson, sendForm, sendJson } from "../core/http.js";

// Danh sach tu (theo pham vi danh muc neu co: "", "uncategorized", id danh muc); data la mang tu.
export function listWords(scope = "") {
  return getJson(scope ? `/api/words?category_id=${encodeURIComponent(scope)}` : "/api/words");
}

// Them (wordId rong) hoac sua tu; formData gom hanzi/pinyin/meaning/example + anh.
export function saveWord(wordId, formData) {
  const url = wordId ? `/api/words/${wordId}` : "/api/words";
  return sendForm(url, wordId ? "PUT" : "POST", formData);
}

export async function deleteWord(wordId) {
  const res = await fetch(`/api/words/${wordId}`, { method: "DELETE" });
  return res.ok;
}

// File .apkg chua cac tu trong pham vi danh muc (rong = tat ca).
export function exportUrl(deckName, scope = "") {
  const category = scope ? `&category_id=${encodeURIComponent(scope)}` : "";
  return `/api/export?deck_name=${encodeURIComponent(deckName)}${category}`;
}

// Xem truoc CSV: data = { rows, summary, warnings } (khong ghi gi); loi cau truc -> ok false, data.error
export function previewImport(csv) {
  return sendJson("/api/words/import/preview", "POST", { csv });
}

// Nhap 1 lo dong hop le (toi da 20) vao danh muc con categoryId (rong = chua phan loai);
// data = { results: [{row, status, reason?, id?}], summary }
export function importWords(rows, categoryId = "") {
  return sendJson("/api/words/import", "POST", { rows, category_id: categoryId });
}
