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

// Hoan tu den het hom nay (ngay mai tu quay lai); khong doi lich on tap.
export function buryWord(wordId) {
  return sendJson(`/api/study/bury/${wordId}`, "POST", {});
}

// So tu dang bi hoan trong pham vi (scope rong = tat ca); data = { count }.
export function fetchBuried(scope) {
  return getJson(scope ? `/api/study/buried?category_id=${encodeURIComponent(scope)}` : "/api/study/buried");
}

// Bo hoan cac tu trong pham vi; data = { count }.
export function unburyAll(scope) {
  return sendJson("/api/study/unbury", "POST", { category_id: scope || "" });
}

// Cham diem; thanh cong thi data co seconds_until_due va word (da cap nhat).
export function reviewWord(wordId, grade) {
  return sendJson(`/api/study/review/${wordId}`, "POST", { grade });
}
