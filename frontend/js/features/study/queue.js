// Hang doi cua 1 phien hoc: the den han (due) va the dang cho den gio (waiting). Khong dung DOM.

import { SESSION_WAIT_SECONDS } from "../../constants.js";

export function createQueue() {
  let due = [];
  let waiting = []; // {word, dueAtMs, again}, sap xep theo gio den han

  return {
    // Bat dau phien moi voi cac tu da den han (bo het the dang cho)
    reset(words) {
      due = words;
      waiting = [];
    },

    // Dua cac the da het thoi gian cho vao cuoi hang doi (sau cac the da den han truoc do)
    promoteWaiting() {
      const now = Date.now();
      waiting = waiting.filter((item) => {
        if (item.dueAtMs > now) return true;
        due.push(item.word);
        return false;
      });
    },

    current: () => due[0],
    dueCount: () => due.length,
    waitingCount: () => waiting.length,
    // So ms con lai den the cho gan nhat (null neu khong co the nao dang cho)
    msUntilNextWaiting: () => (waiting.length ? waiting[0].dueAtMs - Date.now() : null),

    // The Again dang cho (khong con the den han) duoc hien ngay, bo qua gio da dat: chon the Again cho som nhat
    // dua vao due. Tra ve true neu da chuyen 1 the; chi con the Hard/Good/Easy dang cho thi tra ve false.
    promoteEarliestAgain() {
      if (due.length > 0) return false;
      const index = waiting.findIndex((item) => item.again); // waiting da sap theo gio den han
      if (index < 0) return false;
      due.push(waiting.splice(index, 1)[0].word);
      return true;
    },

    // Ghi nhan ket qua cham diem the dau hang doi: the duoc hen duoi 1 gio thi quay lai phien.
    // gradeName = "again" danh dau the de hien som khi het the den han.
    completeCurrent(result, gradeName) {
      due.shift();
      if (result.seconds_until_due < SESSION_WAIT_SECONDS) {
        waiting.push({
          word: result.word,
          dueAtMs: Date.now() + result.seconds_until_due * 1000,
          again: gradeName === "again",
        });
        waiting.sort((a, b) => a.dueAtMs - b.dueAtMs);
      }
    },
  };
}
