// Thong bao ngan cua app (thay alert): mot vung co dinh, doc duoc boi cong nghe ho tro.
// success/info tu tat sau vai giay; error o lai cho den khi dong hoac bi loi moi thay the.

import { icon } from "./icons.js";

const AUTO_HIDE_MS = 3500;

const region = document.createElement("div");
region.className = "toast-region";
region.setAttribute("role", "status");
region.setAttribute("aria-live", "polite");
document.body.appendChild(region);

function remove(node) {
  if (node.isConnected) node.remove();
}

// opts: { action: { label, onClick } }
function show(kind, text, { action = null } = {}) {
  if (kind === "error") region.querySelectorAll(".toast-error").forEach(remove);
  const node = document.createElement("div");
  node.className = `toast toast-${kind}`;
  if (kind === "error") node.setAttribute("role", "alert");

  const message = document.createElement("span");
  message.className = "toast-message";
  message.textContent = text;
  node.appendChild(message);

  if (action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-action";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      remove(node);
      action.onClick();
    });
    node.appendChild(btn);
  }
  if (kind === "error" || action) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "Đóng thông báo");
    close.innerHTML = icon("x");
    close.addEventListener("click", () => remove(node));
    node.appendChild(close);
  }

  region.appendChild(node);
  if (kind !== "error") setTimeout(() => remove(node), action ? AUTO_HIDE_MS * 2 : AUTO_HIDE_MS);
  return node;
}

export const toast = {
  success: (text, opts) => show("success", text, opts),
  info: (text, opts) => show("info", text, opts),
  error: (text, opts) => show("error", text, opts),
};
