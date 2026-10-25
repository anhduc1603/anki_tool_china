// Muc cai dat "Go dap an": 1 cong tat bat/tat go pinyin truoc khi hien dap an (mac dinh tat). Doi la luu ngay.

import { getSettings, updateSettings } from "../../api/settings-api.js";
import { EVENTS, TAB_IDS } from "../../constants.js";
import { on } from "../../core/events.js";

const SETTING_KEY = "study_type_answer";

export function initStudyTypeAnswer() {
  const els = {
    enabled: document.getElementById("type-answer-enabled"),
    msg: document.getElementById("type-answer-msg"),
  };
  let saved = false;

  function setMsg(text, type) {
    els.msg.textContent = text || "";
    els.msg.className = "form-msg" + (type ? " " + type : "");
  }

  function fill(value) {
    saved = value;
    els.enabled.checked = value;
  }

  async function load() {
    try {
      const { data } = await getSettings();
      fill(data.settings[SETTING_KEY].enabled);
      setMsg("", "");
    } catch (err) {
      setMsg("Không tải được cài đặt.", "error");
    }
  }

  els.enabled.addEventListener("change", async () => {
    els.enabled.disabled = true;
    try {
      const { ok, data } = await updateSettings({ [SETTING_KEY]: { enabled: els.enabled.checked } });
      if (!ok) throw new Error(data.error || "Không lưu được cài đặt.");
      fill(data.settings[SETTING_KEY].enabled);
      setMsg("Đã lưu.", "success");
    } catch (err) {
      fill(saved);
      setMsg(err.message, "error");
    } finally {
      els.enabled.disabled = false;
    }
  });

  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.SETTINGS) load();
  });
}
