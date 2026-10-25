// Hang so dung chung o frontend: ten su kien, id tab, gia tri co dinh.

// Cac feature giao tiep voi nhau qua CustomEvent tren document (xem core/events.js)
export const EVENTS = {
  TAB_ACTIVATED: "tab-activated", // detail: { tabId } - sau khi 1 tab duoc hien
  ACTIVATE_TAB: "activate-tab", // detail: { tabId } - yeu cau chuyen tab
  STUDY_SCOPE_REQUEST: "study-scope-request", // detail: { scope } - tab Danh muc xin hoc 1 pham vi
  EDIT_WORD_REQUEST: "edit-word-request", // detail: { word } - tab Hoc/Tu vung xin mo 1 tu de sua o trang Them tu
  DATA_CHANGED: "data-changed", // du lieu (tu, danh muc) vua doi: cac trang dang mo nap lai
  PAGE_TITLE_OVERRIDE: "page-title-override", // detail: { tabId, title|null } - trang tu doi ten tren thanh tren cung (vd "Sua tu")
};

export const TAB_IDS = {
  HOME: "tab-home",
  STUDY: "tab-study",
  LIBRARY: "tab-library",
  ADD: "tab-add",
  SETTINGS: "tab-settings",
};

// Moi trang co 1 dia chi (phan #...) va 1 ten hien tren thanh tren cung. Trang mac dinh la phan tu dau.
export const ROUTES = [
  { hash: "overview", tabId: TAB_IDS.HOME, title: "Tổng quan" },
  { hash: "study", tabId: TAB_IDS.STUDY, title: "Học" },
  { hash: "words", tabId: TAB_IDS.LIBRARY, title: "Từ vựng" },
  { hash: "add", tabId: TAB_IDS.ADD, title: "Thêm từ mới" },
  { hash: "settings", tabId: TAB_IDS.SETTINGS, title: "Cài đặt" },
];

// Tu da on voi khoang cach >= so ngay nay coi la "da thuoc" (nhu the "mature" cua Anki)
export const MATURE_INTERVAL_DAYS = 21;

// Pham vi hoc "chua phan loai" (trung voi backend: constants/scopes.py)
export const UNCATEGORIZED = "uncategorized";

export const GRADES = ["again", "hard", "good", "easy"];

// The duoc hen duoi 1 gio se quay lai trong cung phien hoc
export const SESSION_WAIT_SECONDS = 3600;

// Quet the toi thieu bao nhieu px thi tinh la cham diem
export const SWIPE_THRESHOLD = 80;
// Con tro dich chuyen khong qua bay nhieu px (ca hai chieu) thi la "cham", khong phai vuot
export const TAP_MAX_MOVE = 10;

// Menu trai: khoa localStorage luu trang thai thu gon (trung voi script inline trong index.html)
export const SIDEBAR_STORAGE_KEY = "ankitool.sidebar.collapsed";
// Duoi diem ngat nay menu la ngan keo (drawer); trung voi @media trong css/sidebar.css
export const NARROW_SCREEN_QUERY = "(max-width: 900px)";

// Nhap CSV: so dong gui len moi lan (server cho toi da 20); nho de thanh tien trinh nhich deu
export const IMPORT_BATCH_SIZE = 5;
// Gioi han hien thi/chan som o giao dien (server van kiem tra lai)
export const IMPORT_MAX_BYTES = 1024 * 1024;
