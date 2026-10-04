// Tab Hoc: chon pham vi, nap tu den han, lat the, cham diem (nut/quet), hang cho + dem nguoc.

import { listCategories } from "../../api/categories-api.js";
import { fetchDueWords, reviewWord } from "../../api/study-api.js";
import { EVENTS, TAB_IDS, UNCATEGORIZED } from "../../constants.js";
import { on } from "../../core/events.js";
import { playAudioForText } from "../../shared/audio.js";
import { escapeHtml } from "../../shared/dom.js";
import { formatCountdown } from "./formatters.js";
import { createQueue } from "./queue.js";
import { initSwipe } from "./swipe.js";
import { createStudyView } from "./view.js";

export function initStudy() {
  const view = createStudyView();
  const { els } = view;
  const queue = createQueue();

  const state = {
    waitTimer: null,
    flipped: false,
    busy: false,
    pendingScope: null,
  };

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

  function renderCurrent() {
    clearWaitTimer();
    queue.promoteWaiting();

    const due = queue.dueCount();
    const waiting = queue.waitingCount();
    view.setRemaining(due ? `Còn ${due} từ` + (waiting ? ` (+${waiting} đang chờ)` : "") : "");

    if (due === 0) {
      view.showNoCard({ waiting: waiting > 0 });
      if (waiting) {
        view.setRemaining(`${waiting} từ đang chờ`);
        tickWaiting();
        state.waitTimer = setInterval(tickWaiting, 1000);
      }
      return;
    }

    view.showCard(queue.current());
    state.flipped = false;
  }

  function flip() {
    if (state.flipped || queue.dueCount() === 0) return;
    state.flipped = true;
    view.showAnswer();
  }

  async function grade(gradeName) {
    const word = queue.current();
    if (!word || !state.flipped || state.busy) return;
    state.busy = true;
    try {
      const { ok, status, data } = await reviewWord(word.id, gradeName);
      if (!ok) {
        alert("Không chấm điểm được: " + (data.error || status));
        return;
      }
      queue.completeCurrent(data);
      renderCurrent();
    } finally {
      state.busy = false;
    }
  }

  // ---- Lat the, nghe, xem net viet ----

  els.flipCard.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    flip();
  });
  els.showBtn.addEventListener("click", flip);

  els.playAudioBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const word = queue.current();
    if (word) playAudioForText(word.hanzi);
  });

  els.toggleGifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    view.toggleGif();
  });

  els.gradeButtons.forEach((btn) => {
    btn.addEventListener("click", () => grade(btn.dataset.grade));
  });

  initSwipe(els.flipCard, { isFlipped: () => state.flipped, onGrade: grade });

  els.scopeFilter.addEventListener("change", loadDue);

  // Tab Danh muc yeu cau hoc 1 pham vi: chi ghi nho, ap dung khi tab Hoc duoc mo
  on(EVENTS.STUDY_SCOPE_REQUEST, (e) => {
    state.pendingScope = e.detail.scope || "";
  });

  on(EVENTS.TAB_ACTIVATED, (e) => {
    if (e.detail.tabId === TAB_IDS.STUDY) {
      loadScopeOptions().then(loadDue);
    } else {
      clearWaitTimer();
    }
  });

  loadScopeOptions().then(loadDue);
}
