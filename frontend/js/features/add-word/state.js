// Du lieu dung chung cua tab Them tu moi.

export const state = {
  words: [],
  editingWordId: null, // id tu dang sua trong form (null = dang them moi)
  scope: "", // pham vi danh muc dang loc: "" (tat ca), "uncategorized", hoac id danh muc
  categories: [], // danh muc moi nhat tu server ({id, name, parent_id})
};
