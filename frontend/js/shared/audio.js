// Phat am thanh doc 1 doan chu (dung chung cho tab Them tu va tab Hoc).
// Moi lan bat dau/dung 1 am thanh tang `playToken`: am thanh cu (dang cho sinh audio hoac dang cho phat)
// thay doi token thi tu bo, nen khong bao gio doc chong hay doc nham the cu.

import { toast } from "../core/toast.js";
import { synthesize } from "../api/tts-api.js";

let player = null;
let playToken = 0;
let pendingPlays = 0; // so lan phat dang cho sinh audio (chua toi luc play())

function getPlayer() {
  if (!player) player = document.getElementById("audio-player");
  return player;
}

// Dang co am thanh phat hoac dang cho sinh audio de phat.
export function isAudioPlaying() {
  const p = getPlayer();
  return pendingPlays > 0 || (!!p && !p.paused && !p.ended);
}

// Giai quyet khi khong con am thanh nao dang phat (hoac sau toi da maxMs): dung cho "cho am thanh doc xong".
export function whenAudioIdle(maxMs = 30000) {
  return new Promise((resolve) => {
    if (!isAudioPlaying()) return resolve();
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (!isAudioPlaying() || Date.now() - startedAt >= maxMs) {
        clearInterval(timer);
        resolve();
      }
    }, 150);
  });
}

// Dung am thanh dang phat va huy moi am thanh dang cho phat.
export function stopAudio() {
  playToken += 1;
  const p = getPlayer();
  if (!p) return;
  p.pause();
  try {
    p.currentTime = 0;
  } catch (err) {
    /* chua nap file: bo qua */
  }
}

// Sinh san audio (khong phat) de lan phat sau nghe ngay; moi loi deu bo qua.
export function prefetchAudio(text) {
  if (!text || !text.trim()) return;
  synthesize(text.trim()).catch(() => {});
}

// Tra ve true neu da bat dau phat, false neu khong co gi de phat, bi thay the boi am thanh khac, hoac bi loi.
// silent: dung cho tu dong doc - loi (ke ca trinh duyet chan tu phat) khong bao cho nguoi dung.
export async function playAudioForText(text, { silent = false } = {}) {
  if (!text || !text.trim()) return false;
  const token = ++playToken;
  pendingPlays += 1;
  let pending = true;
  const release = () => {
    if (pending) {
      pending = false;
      pendingPlays -= 1;
    }
  };
  try {
    const { ok, data } = await synthesize(text.trim());
    if (token !== playToken) return false; // co am thanh khac (hoac stopAudio) chen vao: bo
    if (!ok) throw new Error(data.error || "Lỗi sinh audio");
    const p = getPlayer();
    p.src = data.audio_url;
    release(); // tu day trang thai do chinh the <audio> bao
    await p.play();
    return true;
  } catch (err) {
    if (token !== playToken) return false; // bi thay the/dung giua chung (play() bi huy): khong phai loi that
    if (!silent) toast.error("Không phát được âm thanh: " + err.message);
    return false;
  } finally {
    release();
  }
}
