// Phat am thanh doc 1 doan chu (dung chung cho tab Them tu va tab Hoc).

import { synthesize } from "../api/tts-api.js";

let player = null;

// Tra ve true neu da bat dau phat, false neu khong co gi de phat hoac bi loi (loi da duoc bao cho nguoi dung).
export async function playAudioForText(text) {
  if (!text || !text.trim()) return false;
  try {
    const { ok, data } = await synthesize(text.trim());
    if (!ok) throw new Error(data.error || "Lỗi sinh audio");
    if (!player) player = document.getElementById("audio-player");
    player.src = data.audio_url;
    await player.play();
    return true;
  } catch (err) {
    alert("Không phát được âm thanh: " + err.message);
    return false;
  }
}
