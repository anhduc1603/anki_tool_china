// Phat/nghe su kien giua cac feature (CustomEvent tren document).

export function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, handler) {
  document.addEventListener(name, handler);
}
