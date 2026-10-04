# AnkiTool

Web app chạy trên máy cá nhân để học tiếng Trung: nhập từ vựng, xuất file `.apkg` cho Anki, quản lý danh mục 2 cấp và học ngay trong app bằng lịch ôn tập cách quãng (SM-2). Backend Flask + SQLite, frontend HTML/JS/CSS thuần.

## Chạy

Yêu cầu: Python 3.11+.

```bash
pip install -r requirements.txt
python backend/run.py
```

Mở http://127.0.0.1:5000. Tùy chọn:

| Tùy chọn | Ý nghĩa |
|---|---|
| `--port 5001` | đổi cổng |
| `--host 0.0.0.0` | cho máy khác trong mạng truy cập |
| `--no-debug` | tắt chế độ debug/tự nạp lại |
| biến môi trường `ANKITOOL_DATA_DIR` | dùng thư mục dữ liệu khác (mặc định `data/` ở gốc repo), ví dụ để thử mà không đụng dữ liệu thật |

Công cụ dòng lệnh (CSV → `.apkg`, không cần chạy server):

```bash
python backend/generate_anki.py words_sample.csv output.apkg
```

## Dữ liệu

Nằm trong `data/` (không đưa lên git): `ankitool.db` (SQLite), `media/` (ảnh gợi nhớ, GIF nét viết, audio), `words.json` (dữ liệu cũ, chỉ được nhập một lần nếu DB trống).

## Cấu trúc thư mục

```
backend/
├── run.py                       # điểm chạy server
├── generate_anki.py             # điểm chạy CLI (CSV -> .apkg)
└── ankitool/
    ├── __init__.py              # create_app() - app factory
    ├── config/settings.py       # đường dẫn, cấu hình Flask, host/port, ANKITOOL_DATA_DIR
    ├── constants/               # hằng số: srs, review_settings, media, anki, scopes, messages (thông báo lỗi)
    ├── database/                # connection.py (mở kết nối), schema.py (tạo bảng, nâng cấp cột, nhập words.json)
    ├── repositories/            # chỉ chứa SQL: word / category / setting
    ├── services/                # luật nghiệp vụ: word, category, study, settings, media, export + scheduler (SM-2 thuần)
    ├── integrations/            # thư viện ngoài: tts.py (edge-tts), anki/ (genanki: card_template, deck_builder)
    ├── controllers/             # Flask Blueprint mỏng: page, word, category, study, settings, media, export
    ├── errors.py                # AppError / ValidationError (400) / NotFoundError (404) + handler -> JSON
    ├── utils/clock.py           # thời gian địa phương cho lịch ôn
    └── cli/csv_import.py        # logic của generate_anki.py
frontend/
├── index.html                   # khung trang: menu trái (sidebar) + thanh trên cùng + 4 vùng chức năng
├── css/                         # base, forms, add-word, sidebar, categories, study, settings
└── js/
    ├── main.js                  # điểm vào, khởi tạo từng feature
    ├── constants.js             # tên sự kiện, id tab, hằng số FE
    ├── core/                    # events.js, tabs.js (chuyển tab), sidebar.js (thu gọn/ngăn kéo menu trái), http.js
    ├── api/                     # mỗi nhóm API một file (words, categories, study, settings, tts)
    ├── shared/                  # dom.js (escapeHtml), audio.js (phát âm)
    └── features/                # add-word/, categories/, study/, settings/
data/                            # dữ liệu chạy thật (không đưa lên git)
openspec/                        # đặc tả và các thay đổi (OpenSpec)
```

## Khung trang (frontend)

- Bên trái là **menu chức năng** (`<aside id="sidebar">`); bên phải là `.app-main` gồm thanh trên cùng (nút ☰, tên chức năng đang mở, số từ) và các vùng chức năng `.tab-panel`.
- Màn hình rộng (> 900px): menu mở rộng 232px, nút ☰ thu gọn thành cột icon 68px; lựa chọn được nhớ trong `localStorage` (khóa `ankitool.sidebar.collapsed`).
- Màn hình hẹp (≤ 900px): menu là ngăn kéo, mặc định ẩn; ☰ mở ra đè lên nội dung, đóng khi chọn mục, bấm nền mờ hoặc nhấn `Esc`.
- Trạng thái nằm ở class trên `#app-shell` (`sidebar-collapsed`, `sidebar-open`), phần hiển thị do `css/sidebar.css` lo; `core/sidebar.js` chỉ đổi class. Biến CSS `--sidebar-current-w` cho các phần tử cố định (thanh chấm điểm ở tab Học) nằm đúng trong vùng nội dung.

## Quy tắc phụ thuộc

Phụ thuộc đi một chiều:

```
controllers -> services -> repositories -> database
```

- `config`, `constants`, `errors` dùng được ở mọi lớp. `services` có thể dùng `integrations`; `integrations` không import `services`/`controllers`.
- **controller**: chỉ đọc request, gọi đúng một hàm service, `jsonify`. Không viết SQL, không viết luật nghiệp vụ, không tự đoán mã lỗi.
- **service**: luật nghiệp vụ; không `import flask`. Gặp lỗi thì `raise ValidationError(...)` (400) / `NotFoundError(...)` (404); handler trong `errors.py` đổi thành `{"error": "..."}`.
- **repository**: chỉ SQL, trả về dict; không chứa luật nghiệp vụ.
- `services/scheduler.py` là hàm thuần (nhận số, trả số); `study_service` đọc cài đặt rồi truyền vào.
- Thông báo lỗi trả cho giao diện nằm trong `constants/messages.py` (giữ nguyên chuỗi vì FE hiển thị trực tiếp).

Ở frontend:

- Mỗi feature trong `js/features/<tên>/` export `init...()`, được gọi trong `main.js`. Feature **không import feature khác**; giao tiếp qua sự kiện trong `core/events.js` (tên sự kiện khai báo ở `constants.js`).
- Chỉ thư mục `js/api/` gọi `fetch`; UI gọi hàm trong `api/`.
- Hàm dùng chung đặt trong `js/shared/`; CSS của tab nào nằm trong file của tab đó (`css/<tab>.css`).

## Thêm một chức năng mới (ví dụ: "ghi chú")

Backend:

1. `constants/messages.py`: thêm thông báo lỗi mới (nếu có).
2. `repositories/note_repository.py`: câu SQL; nếu cần bảng/cột mới thì thêm vào `database/schema.py` (dùng `CREATE TABLE IF NOT EXISTS` hoặc nâng cấp cột như `_upgrade_words_schema`).
3. `services/note_service.py`: luật nghiệp vụ, `raise ValidationError/NotFoundError`.
4. `controllers/note_controller.py`: Blueprint mỏng, rồi thêm vào `BLUEPRINTS` trong `controllers/__init__.py`.

Frontend:

1. `js/api/notes-api.js`: các hàm gọi API.
2. `js/features/notes/index.js` (+ các file con nếu lớn) export `initNotes()`; thêm gọi `initNotes()` trong `main.js`.
3. `index.html`: thêm một nút vào `<nav class="sidebar-nav">` (`<button class="tab-btn" data-tab="tab-notes" title="Ghi chú" aria-label="Ghi chú">` với `<span class="nav-icon">` và `<span class="nav-label">`) và `<section class="tab-panel hidden" id="tab-notes">` trong `.app-main`; thêm id tab vào `TAB_IDS` trong `constants.js`. Tên hiển thị trên thanh trên cùng lấy từ `.nav-label` nên không cần khai báo thêm.
4. `css/notes.css` và thẻ `<link>` tương ứng trong `index.html`.

Thêm một mục cài đặt mới: thêm khóa + hàm kiểm tra vào `_VALIDATORS` trong `services/settings_service.py`, hằng số mặc định vào `constants/review_settings.py` (hoặc file mới), và một file mới trong `js/features/settings/` (gọi trong `settings/index.js`) cùng một `<section class="settings-section">` trong `index.html`.

## Kiểm tra thủ công

Chưa có test tự động trong repo. Khi sửa code, chạy server với dữ liệu tạm (`ANKITOOL_DATA_DIR=<thư mục tạm>`) và đi qua các luồng: thêm/sửa/xóa từ, dán ảnh, gán danh mục, học bằng nút và vuốt, đổi cài đặt "Thời gian ôn lại", xuất `.apkg`.

## Nâng cấp frontend sau này

Cấu trúc `api/` + `features/` + `shared/` chuyển sang Vite gần như nguyên vẹn. Cân nhắc Vite khi muốn deploy frontend riêng hoặc dùng thư viện npm; cân nhắc React/Vue khi giao diện có nhiều trạng thái dùng chung giữa các tab hoặc nhiều thành phần lặp lại.
