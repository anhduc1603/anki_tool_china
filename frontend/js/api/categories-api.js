import { getJson, sendJson } from "../core/http.js";

export function listCategories() {
  return getJson("/api/categories");
}

export function createCategory(name, parentId) {
  const body = parentId ? { name, parent_id: parentId } : { name };
  return sendJson("/api/categories", "POST", body);
}

export function renameCategory(categoryId, name) {
  return sendJson(`/api/categories/${categoryId}`, "PUT", { name });
}

export function deleteCategory(categoryId) {
  return sendJson(`/api/categories/${categoryId}`, "DELETE");
}

// categoryId null = bo gan danh muc
export function assignWordCategory(wordId, categoryId) {
  return sendJson(`/api/words/${wordId}/category`, "PUT", { category_id: categoryId });
}
