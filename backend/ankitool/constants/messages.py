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

EXAMPLE_PINYIN_MISMATCH = (
    "Pinyin câu ví dụ không khớp: câu ví dụ có {chars} chữ Hán (không tính phần trong ngoặc) "
    "nhưng pinyin có {syllables} âm tiết. Mỗi chữ Hán cần đúng một âm tiết, cách nhau bằng dấu cách."
)
EXAMPLE_PINYIN_INVALID = (
    "Pinyin câu ví dụ có ký tự không hợp lệ: \"{token}\". Chỉ dùng chữ cái pinyin (có dấu thanh), "
    "cách nhau bằng dấu cách, không có dấu câu hay chữ số."
)

# --- danh muc ---
MISSING_CATEGORY_NAME = "Thieu ten danh muc."
CATEGORY_NOT_FOUND = "Khong tim thay danh muc."
PARENT_CATEGORY_NOT_FOUND = "Danh muc cha khong ton tai."
CATEGORY_CHILD_OF_CHILD = "Khong the tao danh muc con duoi 1 danh muc con khac (chi toi da 2 cap)."
CATEGORY_HAS_CHILDREN = "Danh muc nay con danh muc con ben trong, hay xoa chung truoc."
CATEGORY_HAS_WORDS = "Danh muc nay con tu dang gan vao, hay bo gan truoc."
BULK_ASSIGN_INVALID_LIST = "Danh sách từ cần chuyển không hợp lệ."
BULK_ASSIGN_TOO_MANY = "Mỗi lần chỉ chuyển tối đa {limit} từ."
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
TIMING_VALUE_INVALID_AGAIN = "Thoi gian '{grade}' phai la so nguyen tu 0 tro len."
TIMING_UNIT_INVALID_AGAIN = "Don vi cua '{grade}' phai la giay, phut, gio hoac ngay."
TIMING_TOO_LONG = "Thoi gian '{grade}' khong duoc vuot qua 365 ngay."

STUDY_AUTOPLAY_INVALID = (
    "Cài đặt tự động đọc không hợp lệ: cần đúng hai công tắc (từ và câu ví dụ), mỗi công tắc là bật hoặc tắt."
)

STUDY_AUTO_ADVANCE_INVALID = (
    "Cài đặt tự chuyển thẻ không hợp lệ: số giây phải là số nguyên từ 0 đến 3600, hành động phải là "
    "nhắc, Again, Hard, Good hoặc hoãn thẻ, và \"chờ âm thanh\" là bật hoặc tắt."
)
STUDY_TYPE_ANSWER_INVALID = "Cài đặt gõ đáp án không hợp lệ: cần một công tắc bật hoặc tắt."

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
IMPORT_ROW_PINYIN_IGNORED = "{reason} Từ vẫn được nhập nhưng không kèm pinyin câu ví dụ."
IMPORT_ROW_FAILED = "Không lưu được dòng này: {error}"
IMPORT_ROW_FAILED_UNKNOWN = "Không lưu được dòng này do lỗi không xác định."

# --- goi y anh minh hoa ---
IMAGE_KEYWORD_REQUIRED = "Hãy nhập từ khóa để tìm ảnh."
IMAGE_KEYWORD_TOO_LONG = "Từ khóa quá dài (tối đa {limit} ký tự)."
IMAGE_SOURCE_UNKNOWN = "Nguồn ảnh không hợp lệ."
IMAGE_CANDIDATE_EXPIRED = "Kết quả tìm ảnh đã cũ, hãy tìm lại."
IMAGE_FETCH_FAILED = "Không tải được ảnh này, hãy thử ảnh khác hoặc tìm lại."
IMAGE_TOO_LARGE = "Ảnh lớn hơn {limit_mb} MB, hãy thử ảnh khác."
IMAGE_TYPE_NOT_ALLOWED = "Loại ảnh này không được hỗ trợ, hãy thử ảnh khác."
IMAGE_CREDIT_INVALID = "Thông tin nguồn ảnh không hợp lệ."
