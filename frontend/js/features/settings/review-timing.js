// Muc cai dat "Thoi gian on lai": thoi gian cho tung muc cham (Again/Hard/Good/Easy).

import { getSettings, updateSettings } from "../../api/settings-api.js";
import { EVENTS, TAB_IDS } from "../../constants.js";
import { on } from "../../core/events.js";

const SETTING_KEY = "review_timing";

export function initReviewTiming() {
  const els = {
    rows: document.querySelectorAll("#settings-review-timing .timing-row"),
    saveBtn: document.getElementById("timing-save-btn"),
    resetBtn: document.getElementById("timing-reset-btn"),
    msg: document.getElementById("timing-msg"),
  };

  const state = { defaults: null };

  function setMsg(text, type) {
    els.msg.textContent = text || "";
    els.msg.className = "form-msg" + (type ? " " + type : "");
  }

  function fillForm(timing) {
    els.rows.forEach((row) => {
      const item = timing[row.dataset.grade];
      row.querySelector("input").value = item.value;
      row.querySelector("select").value = item.unit;
      row.classList.remove("invalid");
    });
  }

  // Doc form -> {again:{value,unit},...}; value khong phai so nguyen thi de nguyen
  // chuoi de server tu choi va bao loi.
  function readForm() {
    const timing = {};
    els.rows.forEach((row) => {
      const raw = row.querySelector("input").value.trim();
      timing[row.dataset.grade] = {
        value: /^\d+$/.test(raw) ? parseInt(raw, 10) : raw,
        unit: row.querySelector("select").value,
      };
    });
    return timing;
  }

  async function load() {
    try {
      const { data } = await getSettings();
      state.defaults = data.defaults;
      fillForm(data.settings[SETTING_KEY]);
      setMsg("", "");
    } catch (err) {
      setMsg("Không tải được cài đặt.", "error");
    }
  }

  els.saveBtn.addEventListener("click", async () => {
    const timing = readForm();
    const { ok, data } = await updateSettings({ [SETTING_KEY]: timing });
    if (!ok) {
      els.rows.forEach((row) =>
        row.classList.toggle("invalid", !(timing[row.dataset.grade].value >= 1))
      );
      return setMsg(data.error || "Không lưu được cài đặt.", "error");
    }
    fillForm(data.settings[SETTING_KEY]);
    setMsg("Đã lưu.", "success");
  });

  els.resetBtn.addEventListener("click", async () => {
    if (!state.defaults) return;
    const { ok, data } = await updateSettings({ [SETTING_KEY]: state.defaults[SETTING_KEY] });
    if (!ok) return setMsg(data.error || "Không khôi phục được.", "error");
    fillForm(data.settings[SETTING_KEY]);
    setMsg("Đã khôi phục mặc định.", "success");
  });

  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.SETTINGS) load();
  });
}
