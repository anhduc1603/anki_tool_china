import { getJson, sendForm, sendJson } from "../core/http.js";

// Danh sach tu; data la mang tu.
export function listWords() {
  return getJson("/api/words");
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

export function exportUrl(deckName) {
  return `/api/export?deck_name=${encodeURIComponent(deckName)}`;
}

// Xem truoc CSV: data = { rows, summary, warnings } (khong ghi gi); loi cau truc -> ok false, data.error
export function previewImport(csv) {
  return sendJson("/api/words/import/preview", "POST", { csv });
}

// Nhap 1 lo dong hop le (toi da 20); data = { results: [{row, status, reason?, id?}], summary }
export function importWords(rows) {
  return sendJson("/api/words/import", "POST", { rows });
}
