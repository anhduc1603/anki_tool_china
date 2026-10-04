"""Gioi han cua chuc nang nhap tu hang loat tu CSV."""

IMPORT_MAX_ROWS = 500  # so dong du lieu toi da trong 1 lan nhap
IMPORT_MAX_BYTES = 1024 * 1024  # dung luong CSV toi da (UTF-8)
IMPORT_BATCH_MAX_ROWS = 20  # so dong toi da trong 1 yeu cau POST /api/words/import

# Cot bat buoc va tuy chon trong tieu de CSV (so khop khong phan biet hoa/thuong)
IMPORT_REQUIRED_COLUMNS = ("hanzi", "pinyin", "meaning")
IMPORT_OPTIONAL_COLUMNS = ("example",)
IMPORT_DELIMITERS = (",", ";", "\t")  # dau phan cach duoc nhan; hoa thi dung dau phay
