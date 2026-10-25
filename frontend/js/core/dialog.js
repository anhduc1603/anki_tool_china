// Hop thoai cua app (thay confirm/prompt cua trinh duyet): dung <dialog> goc, tra Promise.
// Huy la mac dinh (focus vao nut Huy), Esc dong, focus tra ve phan tu da mo hop thoai.

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, className, type = "button") {
  const b = el("button", `btn ${className}`, label);
  b.type = type;
  return b;
}

let seq = 0;

// Dung khung chung: dau (tieu de) + than + hang nut. Tra { dialog, form, body, actions, done }.
function createDialog(title) {
  const id = `dialog-${++seq}`;
  const dialog = el("dialog", "dialog");
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  const form = el("form", "dialog-form");
  form.method = "dialog";
  const head = el("div", "dialog-head");
  const h2 = el("h2", "", title);
  h2.id = `${id}-title`;
  head.appendChild(h2);
  const body = el("div", "dialog-body");
  const actions = el("div", "dialog-actions");
  form.append(head, body, actions);
  dialog.appendChild(form);
  return { dialog, form, body, actions, id };
}

// Mo hop thoai modal, doi dong, don dep, tra returnValue; khoi phuc focus.
// Dong bang closeWith() ket thuc ngay (khong cho su kien "close" cua trinh duyet); Esc di qua su kien "close".
function openModal(dialog) {
  const opener = document.activeElement;
  document.body.appendChild(dialog);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const value = dialog.returnValue;
      dialog.remove();
      if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus();
      resolve(value);
    };
    dialog._finish = finish;
    dialog.addEventListener("close", finish);
    dialog.showModal();
  });
}

function closeWith(dialog, value) {
  dialog.close(value);
  if (dialog._finish) dialog._finish();
}

function addMessage(body, message) {
  const paragraphs = Array.isArray(message) ? message : [message];
  paragraphs.filter(Boolean).forEach((text) => body.appendChild(el("p", "", text)));
}

// confirmDialog({ title, message (chuoi hoac mang doan), confirmLabel, cancelLabel, danger }) -> Promise<boolean>
export async function confirmDialog({ title, message = "", confirmLabel = "Xác nhận", cancelLabel = "Hủy", danger = false }) {
  const { dialog, body, actions } = createDialog(title);
  addMessage(body, message);
  const cancel = button(cancelLabel, "btn-secondary");
  cancel.autofocus = true; // huy la mac dinh de khong xoa nham khi bam Enter
  cancel.addEventListener("click", () => closeWith(dialog, "cancel"));
  const ok = button(confirmLabel, danger ? "btn-danger" : "btn-primary");
  ok.addEventListener("click", () => closeWith(dialog, "ok"));
  actions.append(cancel, ok);
  return (await openModal(dialog)) === "ok";
}

// promptDialog({ title, label, value, placeholder, confirmLabel, validate(value) -> chuoi loi | "" }) -> Promise<string|null>
export async function promptDialog({ title, label, value = "", placeholder = "", confirmLabel = "Lưu", validate = null }) {
  const { dialog, form, body, actions, id } = createDialog(title);
  const field = el("div", "field");
  const lab = el("label", "", label);
  lab.htmlFor = `${id}-input`;
  const input = el("input", "input");
  input.type = "text";
  input.id = `${id}-input`;
  input.value = value;
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.autofocus = true;
  const error = el("p", "field-error");
  error.id = `${id}-error`;
  error.setAttribute("role", "alert");
  error.hidden = true;
  field.append(lab, input, error);
  body.appendChild(field);

  const cancel = button("Hủy", "btn-secondary");
  cancel.addEventListener("click", () => closeWith(dialog, "cancel"));
  const ok = button(confirmLabel, "btn-primary", "submit");
  actions.append(cancel, ok);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    const problem = validate ? validate(text) : text ? "" : "Vui lòng nhập nội dung.";
    if (problem) {
      error.textContent = problem;
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", error.id);
      input.focus();
      return;
    }
    closeWith(dialog, "ok:" + text);
  });
  input.addEventListener("input", () => {
    error.hidden = true;
    input.removeAttribute("aria-invalid");
  });

  const result = await openModal(dialog);
  return result.startsWith("ok:") ? result.slice(3) : null;
}
