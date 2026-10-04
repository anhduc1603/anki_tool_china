// Hang doi cua 1 phien hoc: the den han (due) va the dang cho den gio (waiting). Khong dung DOM.

import { SESSION_WAIT_SECONDS } from "../../constants.js";

export function createQueue() {
  let due = [];
  let waiting = []; // {word, dueAtMs}, sap xep theo gio den han

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

    // Ghi nhan ket qua cham diem the dau hang doi: the duoc hen duoi 1 gio thi quay lai phien
    completeCurrent(result) {
      due.shift();
      if (result.seconds_until_due < SESSION_WAIT_SECONDS) {
        waiting.push({
          word: result.word,
          dueAtMs: Date.now() + result.seconds_until_due * 1000,
        });
        waiting.sort((a, b) => a.dueAtMs - b.dueAtMs);
      }
    },
  };
}
