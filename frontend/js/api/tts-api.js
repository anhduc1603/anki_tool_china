import { sendJson } from "../core/http.js";

// Sinh audio cho text; thanh cong thi data.audio_url la duong dan file mp3.
export function synthesize(text) {
  return sendJson("/api/tts", "POST", { text });
}
