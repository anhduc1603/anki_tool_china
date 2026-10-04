// Boc fetch: moi ham tra ve { ok, status, data }. data la JSON (hoac {} neu phan hoi khong phai JSON).
// Giao dien tu quyet dinh hien loi (data.error la thong bao tu server).

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getJson(url) {
  return parse(await fetch(url));
}

export async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parse(res);
}

export async function sendForm(url, method, formData) {
  return parse(await fetch(url, { method, body: formData }));
}
