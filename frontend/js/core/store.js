// Kho du lieu dung chung cua cac trang (Tong quan, Tu vung, Them tu): danh muc, tu, so the den han,
// pham vi dang chon o trang Tu vung, tu dang sua. Mot nguon su that thay cho state rieng cua tung tab.

import { listCategories } from "../api/categories-api.js";
import { fetchCounts } from "../api/study-api.js";
import { listWords } from "../api/words-api.js";
import { EVENTS } from "../constants.js";
import { emit } from "./events.js";
import { ZERO_COUNTS } from "./word-scope.js";

export const store = {
  categories: [],
  words: [], // TAT CA tu (khong loc); trang nao can loc thi dung filterByScope
  counts: { categories: {}, uncategorized: ZERO_COUNTS },
  libraryScope: "", // danh muc dang chon o trang Tu vung: "", "uncategorized" hoac id danh muc
  collapsed: new Set(), // danh muc cha dang thu gon (mac dinh: mo)
  editingWord: null, // tu dang sua o trang Them tu (null = them moi)
  status: "idle", // "idle" | "loading" | "ready" | "error"
};

let loadSeq = 0;

// Nap danh muc, tu, so the den han song song. Chi ket qua cua lan goi moi nhat duoc ap dung.
// Tra { ok } va phat DATA_CHANGED khi xong (cac trang dang mo ve lai theo kho).
export async function loadAll() {
  const seq = ++loadSeq;
  store.status = "loading";
  try {
    const [cats, words, counts] = await Promise.all([listCategories(), listWords(), fetchCounts()]);
    if (seq !== loadSeq) return { ok: true, stale: true };
    if (!cats.ok || !words.ok || !counts.ok) throw new Error("load failed");
    store.categories = Array.isArray(cats.data) ? cats.data : [];
    store.words = Array.isArray(words.data) ? words.data : [];
    store.counts = counts.data && counts.data.categories ? counts.data : store.counts;
    // Pham vi da chon nhung danh muc khong con (bi xoa o noi khac): ve "tat ca"
    if (store.libraryScope && store.libraryScope !== "uncategorized" && !store.categories.some((c) => c.id === store.libraryScope)) {
      store.libraryScope = "";
    }
    store.status = "ready";
    emit(EVENTS.DATA_CHANGED, { ok: true });
    return { ok: true };
  } catch (err) {
    if (seq !== loadSeq) return { ok: false, stale: true };
    store.status = "error";
    emit(EVENTS.DATA_CHANGED, { ok: false });
    return { ok: false };
  }
}
