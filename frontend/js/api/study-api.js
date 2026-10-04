import { getJson, sendJson } from "../core/http.js";

// Tu den han ngay bay gio (scope rong = tat ca); data la mang tu kem next_intervals (giay).
export function fetchDueWords(scope) {
  const url = scope ? `/api/study/due?category_id=${encodeURIComponent(scope)}` : "/api/study/due";
  return getJson(url);
}

// { categories: {id: {new, learn, due}}, uncategorized: {...} }
export function fetchCounts() {
  return getJson("/api/study/counts");
}

// Cham diem; thanh cong thi data co seconds_until_due va word (da cap nhat).
export function reviewWord(wordId, grade) {
  return sendJson(`/api/study/review/${wordId}`, "POST", { grade });
}
