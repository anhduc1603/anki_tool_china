// Muc cai dat "Tu dong doc": hai cong tat cho tab Hoc (doc tu khi sang the moi, doc cau vi du khi hien dap an).
// Doi cong tat la luu ngay (khong co nut Luu); loi thi tra cong tat ve gia tri cu.

import { getSettings, updateSettings } from "../../api/settings-api.js";
import { EVENTS, TAB_IDS } from "../../constants.js";
import { on } from "../../core/events.js";

const SETTING_KEY = "study_autoplay";

export function initStudyAutoplay() {
  const els = {
    word: document.getElementById("autoplay-word"),
    example: document.getElementById("autoplay-example"),
    msg: document.getElementById("autoplay-msg"),
  };
  const boxes = [els.word, els.example];
  let saved = { word: true, example: true }; // gia tri da luu gan nhat tren server

  function setMsg(text, type) {
    els.msg.textContent = text || "";
    els.msg.className = "form-msg" + (type ? " " + type : "");
  }

  function fill(values) {
    saved = { word: values.word, example: values.example };
    els.word.checked = saved.word;
    els.example.checked = saved.example;
  }

  async function load() {
    try {
      const { data } = await getSettings();
      fill(data.settings[SETTING_KEY]);
      setMsg("", "");
    } catch (err) {
      setMsg("Không tải được cài đặt.", "error");
    }
  }

  async function save() {
    const next = { word: els.word.checked, example: els.example.checked };
    boxes.forEach((box) => (box.disabled = true));
    try {
      const { ok, data } = await updateSettings({ [SETTING_KEY]: next });
      if (!ok) throw new Error(data.error || "Không lưu được cài đặt.");
      fill(data.settings[SETTING_KEY]);
      setMsg("Đã lưu.", "success");
    } catch (err) {
      fill(saved); // loi: tra cong tat ve gia tri da luu
      setMsg(err.message, "error");
    } finally {
      boxes.forEach((box) => (box.disabled = false));
    }
  }

  boxes.forEach((box) => box.addEventListener("change", save));

  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.SETTINGS) load();
  });
}
