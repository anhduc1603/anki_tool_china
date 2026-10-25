// Tien ich DOM dung chung.

// Thoat ky tu dac biet de chen vao innerHTML (ca trong thuoc tinh nhu aria-label="...")
export function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
