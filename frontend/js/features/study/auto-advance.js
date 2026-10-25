// Tu chuyen the (auto-advance) kieu Anki: sau N giay o cau hoi thi hien dap an, sau M giay o dap an thi lam
// hanh dong da chon. Bat/tat theo phien (mac dinh tat moi lan tai trang). Khong dung DOM.

const AUDIO_WAIT_MAX_MS = 30000;
const LEFT_PAGE_MESSAGE = "Tự chuyển thẻ đã tắt vì bạn rời khỏi trang học.";

// opts: getConfig() -> {question_seconds, answer_seconds, answer_action, wait_for_audio}
//       canRun() -> tab Hoc dang hien va trang dang duoc xem
//       whenAudioIdle(maxMs) -> Promise; reveal(); act(action); notify(text); onToggle(on)
export function createAutoAdvance({ getConfig, canRun, whenAudioIdle, reveal, act, notify, onToggle }) {
  let on = false;
  let timer = null;
  let token = 0; // tang moi khi huy/bat dau: bo qua ket qua cua hen gio cu

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
    token += 1;
  }

  function turnOff(message) {
    if (!on) return;
    on = false;
    cancel();
    onToggle(false);
    if (message) notify(message);
  }

  // step: "question" (cho hien dap an) hoac "answer" (cho hanh dong)
  function start(step) {
    cancel();
    if (!on) return;
    const config = getConfig();
    const seconds = step === "question" ? config.question_seconds : config.answer_seconds;
    if (!(seconds > 0)) return;
    const mine = token;
    timer = setTimeout(async () => {
      timer = null;
      if (mine !== token) return;
      if (!canRun()) return turnOff(LEFT_PAGE_MESSAGE);
      if (config.wait_for_audio) {
        await whenAudioIdle(AUDIO_WAIT_MAX_MS);
        if (mine !== token) return; // trong luc cho: nguoi dung da thao tac / sang the khac
        if (!canRun()) return turnOff(LEFT_PAGE_MESSAGE);
      }
      if (step === "question") reveal();
      else act(config.answer_action);
    }, seconds * 1000);
  }

  return {
    isOn: () => on,
    cancel,
    onQuestionShown: () => start("question"),
    onAnswerShown: () => start("answer"),
    // Bat/tat; tra ve trang thai moi. Nguoi goi goi tiep onQuestionShown/onAnswerShown de dat hen gio cho the dang hien.
    toggle() {
      on = !on;
      cancel();
      onToggle(on);
      notify(on ? "Tự chuyển thẻ: BẬT" : "Tự chuyển thẻ: TẮT");
      return on;
    },
    // Roi tab hoac an trang: tat (message = thong bao neu nguoi dung con nhin thay trang)
    turnOff,
  };
}
