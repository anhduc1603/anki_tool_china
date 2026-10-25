"""Hang so cho cai dat "Tu dong doc" cua tab Hoc (doc tu khi sang the moi, doc cau vi du khi hien dap an)."""

SETTING_STUDY_AUTOPLAY = "study_autoplay"

# Hai cong tat: "word" = tu doc chu Han khi sang the moi; "example" = tu doc cau vi du khi hien dap an
STUDY_AUTOPLAY_KEYS = ("word", "example")
DEFAULT_STUDY_AUTOPLAY = {"word": True, "example": True}

# --- Tu chuyen the (auto-advance) ---
SETTING_STUDY_AUTO_ADVANCE = "study_auto_advance"

# Hanh dong sau khi het thoi gian o mat dap an: nhac, cham Again/Hard/Good, hoac hoan the
AUTO_ADVANCE_ACTIONS = ("remind", "again", "hard", "good", "bury")
AUTO_ADVANCE_MAX_SECONDS = 3600  # 0 = tat buoc do
AUTO_ADVANCE_SECONDS_KEYS = ("question_seconds", "answer_seconds")
AUTO_ADVANCE_KEYS = AUTO_ADVANCE_SECONDS_KEYS + ("answer_action", "wait_for_audio")
DEFAULT_STUDY_AUTO_ADVANCE = {
    "question_seconds": 10,
    "answer_seconds": 10,
    "answer_action": "remind",  # mac dinh khong tu cham/hoan: an toan khi roi may
    "wait_for_audio": True,
}

# --- Go dap an (pinyin) ---
SETTING_STUDY_TYPE_ANSWER = "study_type_answer"
DEFAULT_STUDY_TYPE_ANSWER = {"enabled": False}
