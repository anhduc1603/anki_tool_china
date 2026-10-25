// Bo icon SVG dung chung. Hinh ve nam trong sprite (<svg id="icon-sprite"> o index.html); o day chi sinh the <svg><use>.
// Icon decor an voi cong nghe ho tro; icon dung mot minh (khong co chu canh ben canh) can `label` de co ten truy cap.

import { escapeHtml } from "../shared/dom.js";

export const ICON_NAMES = [
  "home", "study", "library", "plus", "sliders", "gear", "speaker", "edit", "trash", "upload", "download",
  "chevron-down", "chevron-right", "check", "x", "menu", "more", "info", "warning", "back", "play",
  "refresh", "search", "clipboard", "eye", "eye-off", "image", "folder",
];

export function icon(name, { label = "", className = "" } = {}) {
  const cls = className ? `icon ${className}` : "icon";
  const a11y = label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="${cls}" ${a11y}><use href="#i-${name}"></use></svg>`;
}
