// Tab Cai dat: moi muc cai dat la 1 file trong thu muc nay, khoi tao o day.

import { initReviewTiming } from "./review-timing.js";
import { initStudyAutoAdvance } from "./study-auto-advance.js";
import { initStudyAutoplay } from "./study-autoplay.js";
import { initStudyTypeAnswer } from "./study-type-answer.js";

export function initSettings() {
  initReviewTiming();
  initStudyAutoplay();
  initStudyAutoAdvance();
  initStudyTypeAnswer();
}
