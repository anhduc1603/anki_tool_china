// Tab Hoc (kieu Anki): chon pham vi, nap tu den han, hien cau hoi roi dap an ngay duoi, cham diem (nut/quet/phim),
// hang cho + dem nguoc, bo dem 3 mau, hoan the, tu chuyen the, go dap an, tu doc.

import { listCategories } from "../../api/categories-api.js";
import { getSettings } from "../../api/settings-api.js";
import { buryWord, fetchBuried, fetchDueWords, reviewWord, unburyAll } from "../../api/study-api.js";
import { EVENTS, TAB_IDS, UNCATEGORIZED } from "../../constants.js";
import { emit, on } from "../../core/events.js";
import { toast } from "../../core/toast.js";
import { playAudioForText, prefetchAudio, stopAudio, whenAudioIdle } from "../../shared/audio.js";
import { escapeHtml } from "../../shared/dom.js";
import { spokenText } from "../../shared/pinyin.js";
import { createAutoAdvance } from "./auto-advance.js";
import { createBottomBar } from "./bottom-bar.js";
import { formatCountdown } from "./formatters.js";
import { createMoreMenu } from "./more-menu.js";
import { createQueue } from "./queue.js";
import { initShortcuts } from "./shortcuts.js";
import { initSwipe } from "./swipe.js";
import { renderTypeResult } from "./type-answer.js";
import { createStudyView } from "./view.js";

const DEFAULT_AUTOPLAY = { word: true, example: true };
const DEFAULT_AUTO_ADVANCE = { question_seconds: 10, answer_seconds: 10, answer_action: "remind", wait_for_audio: true };
const DEFAULT_TYPE_ANSWER = { enabled: false };

export function initStudy() {
  const view = createStudyView();
  const { els } = view;
  const bar = createBottomBar();
  const queue = createQueue();

  const state = {
    waitTimer: null,
    revealed: false, // dap an da hien (chi cham diem duoc sau do)
    busy: false,
    pendingScope: null,
    tabActive: false, // tab Hoc dang hien (tu doc, tu chuyen the, phim tat chi chay khi true)
    autoplay: { ...DEFAULT_AUTOPLAY },
    autoAdvance: { ...DEFAULT_AUTO_ADVANCE },
    typeAnswer: { ...DEFAULT_TYPE_ANSWER },
  };

  // Tu doc / tu chuyen the chi khi nguoi dung dang o tab Hoc va trang dang duoc xem
  function canRun() {
    return state.tabActive && document.visibilityState === "visible";
  }

  // Cai dat cua tab Hoc: nap lai moi lan mo tab (loi mang -> mac dinh)
  async function loadStudySettings() {
    try {
      const { data } = await getSettings();
      const s = data.settings;
      state.autoplay = { word: s.study_autoplay.word !== false, example: s.study_autoplay.example !== false };
      state.autoAdvance = { ...DEFAULT_AUTO_ADVANCE, ...s.study_auto_advance };
      state.typeAnswer = { enabled: s.study_type_answer.enabled === true };
    } catch (err) {
      state.autoplay = { ...DEFAULT_AUTOPLAY };
      state.autoAdvance = { ...DEFAULT_AUTO_ADVANCE };
      state.typeAnswer = { ...DEFAULT_TYPE_ANSWER };
    }
  }

  function clearWaitTimer() {
    if (state.waitTimer) clearInterval(state.waitTimer);
    state.waitTimer = null;
  }

  function tickWaiting() {
    const remaining = queue.msUntilNextWaiting();
    if (remaining === null || remaining <= 0) return renderCurrent();
    view.setCountdown(formatCountdown(remaining));
  }

  // Pham vi hoc: tat ca / chua phan loai / tung danh muc cha (gom cac con) / tung danh muc con
  async function loadScopeOptions() {
    const { data: categories } = await listCategories();
    const parents = categories.filter((c) => c.parent_id === null);
    const previous = els.scopeFilter.value;

    let html =
      '<option value="">Tất cả danh mục</option>' +
      `<option value="${UNCATEGORIZED}">Chưa phân loại</option>`;
    parents.forEach((parent) => {
      html += `<option value="${parent.id}">${escapeHtml(parent.name)} (tất cả)</option>`;
      categories
        .filter((c) => c.parent_id === parent.id)
        .forEach((child) => {
          html += `<option value="${child.id}">${escapeHtml(parent.name)} / ${escapeHtml(child.name)}</option>`;
        });
    });
    els.scopeFilter.innerHTML = html;

    const wanted = state.pendingScope !== null ? state.pendingScope : previous;
    state.pendingScope = null;
    const exists = Array.from(els.scopeFilter.options).some((o) => o.value === wanted);
    els.scopeFilter.value = exists ? wanted : "";
  }

  async function loadDue() {
    const { data } = await fetchDueWords(els.scopeFilter.value);
    queue.reset(Array.isArray(data) ? data : []);
    renderCurrent();
  }

  // Man "het tu": bao so tu dang hoan den mai (kem nut Bo hoan)
  async function loadBuriedNote() {
    try {
      const { data } = await fetchBuried(els.scopeFilter.value);
      view.setBuriedNote(data.count);
    } catch (err) {
      view.setBuriedNote(0);
    }
  }

  function renderCurrent() {
    clearWaitTimer();
    autoAdvance.cancel();
    queue.promoteWaiting();
    queue.promoteEarliestAgain(); // het the den han: the vua cham Again hien ngay, khong dem nguoc

    bar.setCounts(queue.counts(), queue.currentKind());
    const due = queue.dueCount();
    const waiting = queue.waitingCount();

    if (due === 0) {
      stopAudio();
      state.revealed = false;
      bar.hide();
      view.showNoCard({ waiting: waiting > 0 });
      if (waiting) {
        tickWaiting();
        state.waitTimer = setInterval(tickWaiting, 1000);
      } else {
        loadBuriedNote();
      }
      return;
    }

    const word = queue.current();
    state.revealed = false;
    view.showCard(word, { typeAnswer: state.typeAnswer.enabled });
    bar.showQuestion(word.next_intervals);

    // The moi: dung am cu; doc tu, tai truoc audio cau vi du de luc hien dap an nghe ngay
    stopAudio();
    if (canRun()) {
      if (state.autoplay.word) playAudioForText(word.hanzi, { silent: true });
      if (state.autoplay.example) prefetchAudio(spokenText(word.example));
    }
    autoAdvance.onQuestionShown();
  }

  // Hien dap an (nut, phim, o go Enter, hoac tu chuyen the)
  function reveal() {
    if (state.revealed || queue.dueCount() === 0) return;
    autoAdvance.cancel();
    state.revealed = true;
    const word = queue.current();
    const typeResultHtml = state.typeAnswer.enabled ? renderTypeResult(view.getTypedText(), word.pinyin) : null;
    view.showAnswer({ typeResultHtml });

    // Hien dap an: doc cau vi du (thay am dang phat); tu khong co cau de doc thi im lang
    const spoken = spokenText(word.example);
    if (canRun() && state.autoplay.example && spoken) {
      playAudioForText(spoken, { silent: true });
    }
    autoAdvance.onAnswerShown();
  }

  async function grade(gradeName) {
    const word = queue.current();
    if (!word || state.busy) return; // cham duoc ngay, khong can da hien dap an
    state.busy = true;
    autoAdvance.cancel();
    try {
      const { ok, status, data } = await reviewWord(word.id, gradeName);
      if (!ok) {
        toast.error("Không chấm điểm được: " + (data.error || status));
        return;
      }
      queue.completeCurrent(data, gradeName);
      renderCurrent();
    } finally {
      state.busy = false;
    }
  }

  // Hoan the hien tai den het hom nay (khong cham diem, khong doi lich on)
  async function buryCurrent() {
    const word = queue.current();
    if (!word || state.busy) return;
    state.busy = true;
    autoAdvance.cancel();
    try {
      const { ok, status, data } = await buryWord(word.id);
      if (!ok) {
        toast.error("Không hoãn được thẻ: " + (data.error || status));
        return;
      }
      queue.removeCurrent();
      renderCurrent();
    } finally {
      state.busy = false;
    }
  }

  // Nghe lai: mat cau hoi doc tu; mat dap an doc cau vi du neu co van ban de doc, khong thi doc tu
  function replay() {
    const word = queue.current();
    if (!word) return;
    const spoken = spokenText(word.example);
    playAudioForText(state.revealed && spoken ? spoken : word.hanzi);
  }

  // Sua tu: mo tab Them tu moi voi tu da nap vao form (cac feature khong import nhau: dung su kien)
  function editWord() {
    const word = queue.current();
    if (!word) return;
    autoAdvance.cancel();
    emit(EVENTS.ACTIVATE_TAB, { tabId: TAB_IDS.ADD });
    emit(EVENTS.EDIT_WORD_REQUEST, { word });
  }

  // Bat/tat tu chuyen the; khi bat thi dat hen gio cho the dang hien
  function toggleAuto() {
    const isOn = autoAdvance.toggle();
    if (isOn && queue.current()) {
      if (state.revealed) autoAdvance.onAnswerShown();
      else autoAdvance.onQuestionShown();
    }
  }

  // ---- Tu chuyen the ----
  const autoAdvance = createAutoAdvance({
    getConfig: () => state.autoAdvance,
    canRun,
    whenAudioIdle,
    reveal,
    act: (action) => {
      if (action === "bury") buryCurrent();
      else if (action === "remind") view.toast("Hết giờ — hãy chọn mức nhớ (1–4).");
      else grade(action);
    },
    notify: (text) => view.toast(text),
    onToggle: (isOn) => {
      bar.setAutoLabel(isOn);
      menu.setAutoChecked(isOn);
    },
  });

  // ---- Menu Them ----
  const menu = createMoreMenu({ onBury: buryCurrent, onReplay: replay, onToggleAuto: toggleAuto });

  // ---- Nut, o go, phim tat ----
  bar.els.editBtn.addEventListener("click", editWord);
  bar.els.gradeButtons.forEach((btn) => {
    btn.addEventListener("click", () => grade(btn.dataset.grade));
  });

  els.playAudioBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const word = queue.current();
    if (word) playAudioForText(word.hanzi);
  });
  els.toggleGifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    view.toggleGif();
  });
  els.togglePinyinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    view.toggleExamplePinyin();
  });

  // Enter trong o go pinyin: hien dap an (bo qua Enter chon tu cua bo go)
  els.typeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      reveal();
    }
  });

  // Cham BAT KY DAU tren man hinh hoc = hien dap an; vuot phai/trai = Good/Again (ca khi chua hien dap an);
  // phan hoi khi dang keo
  initSwipe(els.area, els.card, { onGrade: grade, onTap: reveal, onDrag: (kind) => view.setSwipeFeedback(kind) });

  initShortcuts({
    isActive: () => state.tabActive,
    isBlocked: () => menu.isOpen(),
    hasCard: () => queue.dueCount() > 0,
    isRevealed: () => state.revealed,
    reveal,
    grade,
    replay,
    toggleAuto,
    bury: buryCurrent,
    edit: editWord,
  });

  els.scopeFilter.addEventListener("change", loadDue);

  els.unburyBtn.addEventListener("click", async () => {
    els.unburyBtn.disabled = true;
    try {
      await unburyAll(els.scopeFilter.value);
      await loadDue();
    } finally {
      els.unburyBtn.disabled = false;
    }
  });

  // Tab Danh muc yeu cau hoc 1 pham vi: chi ghi nho, ap dung khi tab Hoc duoc mo
  on(EVENTS.STUDY_SCOPE_REQUEST, (e) => {
    state.pendingScope = e.detail.scope || "";
  });

  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.STUDY) {
      state.tabActive = true;
      Promise.all([loadScopeOptions(), loadStudySettings()]).then(loadDue);
    } else {
      state.tabActive = false;
      autoAdvance.turnOff(null); // roi tab Hoc: tat tu chuyen the (khong co gi de bao vi dang o tab khac)
      menu.close();
      clearWaitTimer();
      stopAudio();
    }
  });

  // Trang bi an (chuyen tab trinh duyet...): tat tu chuyen the
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") autoAdvance.turnOff(null);
  });

}
