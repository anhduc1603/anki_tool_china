// Ham thuan (khong DOM, khong mang) de loc/dem tu theo pham vi danh muc va phan loai trang thai tu.
// Quy tac loc khop voi backend (services/category_service.py: resolve_scope): "" = tat ca, "uncategorized",
// id danh muc cha = cac danh muc con cua no, id danh muc con = chinh no, id la = khong co tu nao.

import { MATURE_INTERVAL_DAYS, UNCATEGORIZED } from "../constants.js";

export const ZERO_COUNTS = { new: 0, learn: 0, due: 0 };

export const parentsOf = (categories) => categories.filter((c) => c.parent_id === null);
export const childrenOf = (categories, parentId) => categories.filter((c) => c.parent_id === parentId);
export const allChildren = (categories) => categories.filter((c) => c.parent_id !== null);

export function categoryName(categories, id) {
  const c = categories.find((x) => x.id === id);
  return c ? c.name : "";
}

// Nhan day du cua danh muc con: "Cha / Con"
export function childLabel(categories, child) {
  return `${categoryName(categories, child.parent_id)} / ${child.name}`;
}

export function filterByScope(words, categories, scope) {
  if (!scope) return words;
  if (scope === UNCATEGORIZED) return words.filter((w) => !w.category_id);
  const category = categories.find((c) => c.id === scope);
  if (!category) return [];
  if (category.parent_id === null) {
    const ids = new Set(childrenOf(categories, category.id).map((c) => c.id));
    return words.filter((w) => ids.has(w.category_id));
  }
  return words.filter((w) => w.category_id === scope);
}

// { all, uncategorized, byCategory: { [id]: so tu } }; danh muc cha = tong cac con
export function countWords(words, categories) {
  const byCategory = {};
  categories.forEach((c) => {
    byCategory[c.id] = 0;
  });
  let uncategorized = 0;
  words.forEach((w) => {
    if (!w.category_id || !(w.category_id in byCategory)) uncategorized += 1;
    else byCategory[w.category_id] += 1;
  });
  allChildren(categories).forEach((c) => {
    if (c.parent_id in byCategory) byCategory[c.parent_id] += byCategory[c.id];
  });
  return { all: words.length, uncategorized, byCategory };
}

// "new" = chua on lan nao; "mature" = da on va khoang on >= MATURE_INTERVAL_DAYS; con lai "learning"
export function wordStatus(word) {
  if (!word.reviewed) return "new";
  return (word.interval_days || 0) >= MATURE_INTERVAL_DAYS ? "mature" : "learning";
}

export const STATUS_LABELS = { new: "Chưa học", learning: "Đang học", mature: "Đã thuộc" };

export function statusCounts(words) {
  const out = { new: 0, learning: 0, mature: 0 };
  words.forEach((w) => {
    out[wordStatus(w)] += 1;
  });
  return out;
}

// Tong so the den han hien tai tu /api/study/counts: cac danh muc cha da gom con, nen chi cong cha + chua phan loai
export function dueTotals(counts, categories) {
  const total = { ...ZERO_COUNTS };
  const add = (c) => {
    if (!c) return;
    total.new += c.new;
    total.learn += c.learn;
    total.due += c.due;
  };
  parentsOf(categories).forEach((p) => add(counts.categories[p.id]));
  add(counts.uncategorized);
  return { ...total, total: total.new + total.learn + total.due };
}
