// Muc cai dat "Tu chuyen the": so giay hien dap an, so giay roi hanh dong, hanh dong, cho am thanh.
// Doi o nao la kiem tra roi luu ngay; loi thi tra ve gia tri da luu.

import { getSettings, updateSettings } from "../../api/settings-api.js";
import { EVENTS, TAB_IDS } from "../../constants.js";
import { on } from "../../core/events.js";

const SETTING_KEY = "study_auto_advance";

export function initStudyAutoAdvance() {
  const els = {
    question: document.getElementById("aa-question"),
    answer: document.getElementById("aa-answer"),
    action: document.getElementById("aa-action"),
    waitAudio: document.getElementById("aa-wait-audio"),
    msg: document.getElementById("aa-msg"),
  };
  const controls = [els.question, els.answer, els.action, els.waitAudio];
  let saved = null; // gia tri da luu gan nhat tren server

  function setMsg(text, type) {
    els.msg.textContent = text || "";
    els.msg.className = "form-msg" + (type ? " " + type : "");
  }

  function fill(values) {
    saved = { ...values };
    els.question.value = values.question_seconds;
    els.answer.value = values.answer_seconds;
    els.action.value = values.answer_action;
    els.waitAudio.checked = values.wait_for_audio;
  }

  // So giay la so nguyen: o khong phai so nguyen thi gui nguyen chuoi de server tu choi va bao loi
  const readSeconds = (input) => (/^\d+$/.test(input.value.trim()) ? parseInt(input.value, 10) : input.value);

  function read() {
    return {
      question_seconds: readSeconds(els.question),
      answer_seconds: readSeconds(els.answer),
      answer_action: els.action.value,
      wait_for_audio: els.waitAudio.checked,
    };
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
    controls.forEach((c) => (c.disabled = true));
    try {
      const { ok, data } = await updateSettings({ [SETTING_KEY]: read() });
      if (!ok) throw new Error(data.error || "Không lưu được cài đặt.");
      fill(data.settings[SETTING_KEY]);
      setMsg("Đã lưu.", "success");
    } catch (err) {
      if (saved) fill(saved); // loi: tra ve gia tri da luu
      setMsg(err.message, "error");
    } finally {
      controls.forEach((c) => (c.disabled = false));
    }
  }

  controls.forEach((control) => control.addEventListener("change", save));

  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.SETTINGS) load();
  });
}
