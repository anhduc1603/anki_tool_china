import { getJson, sendForm } from "../core/http.js";

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
