// Trang Tong quan: hom nay can hoc bao nhieu (Moi/Dang hoc/On lai), nut Hoc ngay, bo the theo danh muc,
// tinh hinh kho tu, loi tat them tu; nguoi dung moi thay 3 buoc bat dau. Du lieu o core/store.js.

import { EVENTS, TAB_IDS } from "../../constants.js";
import { emit, on } from "../../core/events.js";
import { loadAll, store } from "../../core/store.js";
import { dueTotals, statusCounts } from "../../core/word-scope.js";
import { createDeckTable } from "./deck-table.js";

export function initOverview() {
  const $ = (id) => document.getElementById(id);
  const els = {
    error: $("home-error"),
    retry: $("home-retry-btn"),
    onboarding: $("home-onboarding"),
    content: $("home-content"),
    msg: $("home-today-msg"),
    nNew: $("home-new"),
    nLearn: $("home-learn"),
    nReview: $("home-review"),
    nTotal: $("home-due-total"),
    studyBtn: $("home-study-btn"),
    decks: $("home-decks"),
    total: $("home-total"),
    bar: $("home-bar"),
    cNew: $("home-c-new"),
    cLearning: $("home-c-learning"),
    cMature: $("home-c-mature"),
  };
  let active = false;
  let loadedOnce = false; // lan dau chua co du lieu: giu o tai (skeleton) thay vi so 0

  const deckTable = createDeckTable(els.decks, {
    onStudy: (scope) => {
      emit(EVENTS.STUDY_SCOPE_REQUEST, { scope });
      emit(EVENTS.ACTIVATE_TAB, { tabId: TAB_IDS.STUDY });
    },
  });

  function setNum(el, n) {
    el.textContent = String(n);
    el.classList.toggle("counter-zero", n === 0);
  }

  function renderBar(c, total) {
    const pct = (n) => (total ? (n / total) * 100 : 0);
    els.bar.innerHTML =
      `<span class="bar-mature" style="width:${pct(c.mature)}%"></span>` +
      `<span class="bar-learning" style="width:${pct(c.learning)}%"></span>` +
      `<span class="bar-new" style="width:${pct(c.new)}%"></span>`;
    els.bar.setAttribute(
      "aria-label",
      `${c.new} chưa học, ${c.learning} đang học, ${c.mature} đã thuộc, trên tổng ${total} từ`
    );
  }

  function render() {
    const failed = store.status === "error";
    els.error.classList.toggle("hidden", !failed);
    if (failed) {
      els.onboarding.classList.add("hidden");
      els.content.classList.add("hidden");
      return;
    }
    if (store.status !== "ready" && !loadedOnce) {
      // dang tai lan dau: giu nguyen khung skeleton trong HTML
      els.onboarding.classList.add("hidden");
      els.content.classList.remove("hidden");
      return;
    }
    loadedOnce = true;

    const empty = store.words.length === 0;
    els.onboarding.classList.toggle("hidden", !empty);
    els.content.classList.toggle("hidden", empty);
    if (empty) return;

    const due = dueTotals(store.counts, store.categories);
    setNum(els.nNew, due.new);
    setNum(els.nLearn, due.learn);
    setNum(els.nReview, due.due);
    setNum(els.nTotal, due.total);
    els.msg.textContent =
      due.total > 0
        ? `Có ${due.total} thẻ đến hạn ngay bây giờ.`
        : "Hôm nay đã xong, không còn thẻ nào đến hạn ngay bây giờ. Thẻ mới sẽ hiện khi đến giờ ôn lại.";
    els.studyBtn.classList.toggle("hidden", due.total === 0);

    deckTable.render();

    const c = statusCounts(store.words);
    els.total.textContent = String(store.words.length);
    els.cNew.textContent = String(c.new);
    els.cLearning.textContent = String(c.learning);
    els.cMature.textContent = String(c.mature);
    renderBar(c, store.words.length);
  }

  els.studyBtn.addEventListener("click", () => {
    emit(EVENTS.STUDY_SCOPE_REQUEST, { scope: "" });
    emit(EVENTS.ACTIVATE_TAB, { tabId: TAB_IDS.STUDY });
  });
  els.retry.addEventListener("click", () => {
    store.status = "loading";
    render();
    loadAll();
  });

  on(EVENTS.DATA_CHANGED, () => {
    if (active) render();
  });
  on(EVENTS.TAB_ACTIVATED, (e) => {
    active = e.detail.tabId === TAB_IDS.HOME;
    if (!active) return;
    render();
    loadAll();
  });
}
