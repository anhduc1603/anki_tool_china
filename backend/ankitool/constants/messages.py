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
