// Hang so dung chung o frontend: ten su kien, id tab, gia tri co dinh.

// Cac feature giao tiep voi nhau qua CustomEvent tren document (xem core/events.js)
export const EVENTS = {
  TAB_ACTIVATED: "tab-activated", // detail: { tabId } - sau khi 1 tab duoc hien
  ACTIVATE_TAB: "activate-tab", // detail: { tabId } - yeu cau chuyen tab
  STUDY_SCOPE_REQUEST: "study-scope-request", // detail: { scope } - tab Danh muc xin hoc 1 pham vi
};

export const TAB_IDS = {
  ADD: "tab-add",
  CATEGORIES: "tab-categories",
  STUDY: "tab-study",
  SETTINGS: "tab-settings",
};

// Pham vi hoc "chua phan loai" (trung voi backend: constants/scopes.py)
export const UNCATEGORIZED = "uncategorized";

export const GRADES = ["again", "hard", "good", "easy"];

// The duoc hen duoi 1 gio se quay lai trong cung phien hoc
export const SESSION_WAIT_SECONDS = 3600;

// Quet the toi thieu bao nhieu px thi tinh la cham diem
export const SWIPE_THRESHOLD = 80;

// Menu trai: khoa localStorage luu trang thai thu gon (trung voi script inline trong index.html)
export const SIDEBAR_STORAGE_KEY = "ankitool.sidebar.collapsed";
// Duoi diem ngat nay menu la ngan keo (drawer); trung voi @media trong css/sidebar.css
export const NARROW_SCREEN_QUERY = "(max-width: 900px)";
