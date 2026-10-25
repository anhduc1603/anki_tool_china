import { getJson } from "../core/http.js";

// Tim anh minh hoa o 1 nguon ("commons" | "openverse"); data = { source, status: "ok"|"error"|"limited", results: [...] }
export function searchImages(keyword, source) {
  return getJson(`/api/images/search?q=${encodeURIComponent(keyword)}&source=${source}`);
}

export function suggestedImageUrl(token) {
  return `/api/images/${token}/file`;
}

// Tai anh cua 1 ung vien ve dang Blob; loi -> { ok: false, error } (thong bao tu server neu co)
export async function downloadSuggestedImage(token) {
  const res = await fetch(suggestedImageUrl(token));
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || "Không tải được ảnh." };
  }
  return { ok: true, blob: await res.blob() };
}
