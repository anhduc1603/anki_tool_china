"""
Thong bao loi tra ve cho FE. Giu nguyen tung chu (khong dau) nhu truoc khi refactor
vi giao dien hien thi truc tiep chuoi nay. Chuoi co {ten} dung .format(ten=...).
"""

# --- tu vung ---
MISSING_WORD_FIELDS = "Thieu chu Han, pinyin hoac nghia."
WORD_NOT_FOUND = "Khong tim thay tu."
UNSUPPORTED_IMAGE_FORMAT = "Dinh dang file khong ho tro: {ext}"
UNKNOWN_IMAGE_EXTENSION = "(khong ro)"
AUDIO_ERROR = "Loi sinh audio: {error}"
MISSING_TTS_TEXT = "Thieu noi dung can doc."

# --- danh muc ---
MISSING_CATEGORY_NAME = "Thieu ten danh muc."
CATEGORY_NOT_FOUND = "Khong tim thay danh muc."
PARENT_CATEGORY_NOT_FOUND = "Danh muc cha khong ton tai."
CATEGORY_CHILD_OF_CHILD = "Khong the tao danh muc con duoi 1 danh muc con khac (chi toi da 2 cap)."
CATEGORY_HAS_CHILDREN = "Danh muc nay con danh muc con ben trong, hay xoa chung truoc."
CATEGORY_HAS_WORDS = "Danh muc nay con tu dang gan vao, hay bo gan truoc."
ASSIGN_TO_PARENT_CATEGORY = "Chi duoc gan tu vao danh muc con, khong duoc gan vao danh muc cha."

# --- hoc / on tap ---
INVALID_GRADE = "Grade khong hop le (again, hard, good, easy)."
INVALID_GRADE_NAME = "Grade khong hop le: {grade}"  # loi lap trinh (scheduler), khong tra ra API

# --- xuat file ---
EMPTY_WORD_LIST = "Danh sach tu dang trong."
EXPORT_ERROR = "Loi xuat file: {error}"

# --- cai dat ---
NOTHING_TO_SAVE = "Khong co cai dat nao de luu."
UNKNOWN_SETTING = "Muc cai dat khong ton tai: {key}"
TIMING_INCOMPLETE = "Phai co du 4 muc thoi gian: again, hard, good, easy."
TIMING_ITEM_INVALID = "Thoi gian '{grade}' khong hop le."
TIMING_VALUE_INVALID = "Thoi gian '{grade}' phai la so nguyen tu 1 tro len."
TIMING_UNIT_INVALID = "Don vi cua '{grade}' phai la phut, gio hoac ngay."
TIMING_TOO_LONG = "Thoi gian '{grade}' khong duoc vuot qua 365 ngay."

# --- nhap tu hang loat tu CSV (thong bao moi: tieng Viet co dau vi hien thi truc tiep cho nguoi dung) ---
IMPORT_EMPTY = "Nội dung CSV đang trống."
IMPORT_NOT_TEXT = "Thiếu nội dung CSV."
IMPORT_MALFORMED = "Không đọc được CSV: {error}"
IMPORT_MISSING_COLUMNS = "Tiêu đề CSV thiếu cột bắt buộc: {columns}."
IMPORT_TOO_MANY_ROWS = "CSV có {count} dòng dữ liệu, vượt quá giới hạn {limit} dòng mỗi lần nhập."
IMPORT_TOO_LARGE = "CSV lớn hơn {limit_kb} KB, vượt quá giới hạn cho phép."
IMPORT_IGNORED_COLUMNS = "Bỏ qua cột không dùng: {columns}."
IMPORT_BATCH_INVALID = "Danh sách dòng cần nhập không hợp lệ."
IMPORT_BATCH_TOO_LARGE = "Mỗi lần chỉ nhập tối đa {limit} dòng."
IMPORT_ROW_MISSING_FIELDS = "Thiếu chữ Hán, pinyin hoặc nghĩa."
IMPORT_ROW_DUPLICATE_EXISTING = "Từ đã có trong danh sách (giữ nguyên từ cũ)."
IMPORT_ROW_DUPLICATE_IN_FILE = "Trùng với dòng {first_row} trong cùng file."
IMPORT_ROW_TOO_MANY_VALUES = (
    "Có nhiều giá trị hơn số cột trong tiêu đề — có thể thiếu dấu ngoặc kép quanh trường chứa dấu phẩy."
)
IMPORT_ROW_FAILED = "Không lưu được dòng này: {error}"
IMPORT_ROW_FAILED_UNKNOWN = "Không lưu được dòng này do lỗi không xác định."
