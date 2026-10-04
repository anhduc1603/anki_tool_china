// Phat am thanh doc 1 doan chu (dung chung cho tab Them tu va tab Hoc).

import { synthesize } from "../api/tts-api.js";

let player = null;

export async function playAudioForText(text) {
  if (!text || !text.trim()) return;
  try {
    const { ok, data } = await synthesize(text.trim());
    if (!ok) throw new Error(data.error || "Lỗi sinh audio");
    if (!player) player = document.getElementById("audio-player");
    player.src = data.audio_url;
    await player.play();
  } catch (err) {
    alert("Không phát được âm thanh: " + err.message);
  }
}
