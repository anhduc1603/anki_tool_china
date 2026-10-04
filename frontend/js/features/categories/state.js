// Du lieu dung chung cua tab Danh muc (do index.js nap tu server).

export const ZERO_COUNTS = { new: 0, learn: 0, due: 0 };

export const state = {
  categories: [],
  words: [],
  counts: { categories: {}, uncategorized: ZERO_COUNTS },
  collapsed: new Set(), // danh muc cha dang thu gon (mac dinh: mo)
};

export const parents = () => state.categories.filter((c) => c.parent_id === null);
export const childrenOf = (parentId) => state.categories.filter((c) => c.parent_id === parentId);
export const allChildren = () => state.categories.filter((c) => c.parent_id !== null);
export const parentName = (id) => (state.categories.find((c) => c.id === id) || {}).name || "";
export const childLabel = (c) => `${parentName(c.parent_id)} / ${c.name}`;
