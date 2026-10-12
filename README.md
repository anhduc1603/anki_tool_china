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
├── cleanup_media.py             # điểm chạy CLI dọn file media không còn từ nào dùng
└── ankitool/
    ├── __init__.py              # create_app() - app factory
    ├── config/settings.py       # đường dẫn, cấu hình Flask, host/port, ANKITOOL_DATA_DIR
    ├── constants/               # hằng số: srs, review_settings, media, anki, scopes, import_limits, messages (thông báo lỗi)
    ├── database/                # connection.py (mở kết nối), schema.py (tạo bảng, nâng cấp cột, nhập words.json)
    ├── repositories/            # chỉ chứa SQL: word / category / setting
    ├── services/                # luật nghiệp vụ: word, word_import (nhập CSV), category, study, settings, media, export + scheduler (SM-2 thuần)
    ├── integrations/            # thư viện ngoài: tts.py (edge-tts), anki/ (genanki: card_template, deck_builder)
    ├── controllers/             # Flask Blueprint mỏng: page, word, word_import, category, study, settings, media, export
    ├── errors.py                # AppError / ValidationError (400) / NotFoundError (404) + handler -> JSON
    ├── utils/clock.py           # thời gian địa phương cho lịch ôn
    └── cli/                     # csv_import.py (logic generate_anki.py), cleanup_media.py (logic cleanup_media.py)
frontend/
├── index.html                   # khung trang: menu trái (sidebar) + thanh trên cùng + 4 vùng chức năng
├── css/                         # base, forms, add-word, import, sidebar, categories, study, settings
└── js/
    ├── main.js                  # điểm vào, khởi tạo từng feature
    ├── constants.js             # tên sự kiện, id tab, hằng số FE
    ├── core/                    # events.js, tabs.js (chuyển tab), sidebar.js (thu gọn/ngăn kéo menu trái), http.js
    ├── api/                     # mỗi nhóm API một file (words, categories, study, settings, tts)
    ├── shared/                  # dom.js (escapeHtml), audio.js (phát âm)
    └── features/                # add-word/ (kèm import/ = hộp thoại nhập CSV), categories/, study/, settings/
data/                            # dữ liệu chạy thật (không đưa lên git)
openspec/                        # đặc tả và các thay đổi (OpenSpec)
```

## Cài đặt thời gian ôn lại (tab Cài đặt)

Với từ mới hoặc từ vừa quên (đang ở giai đoạn học), mỗi mức chấm điểm quay lại sau một khoảng bạn chọn; từ đã thuộc (Good/Easy) thì các lần sau tự giãn theo ngày. Mặc định: Again 1 phút, Hard 6 phút, Good 10 phút, Easy 4 ngày.

- **Again** đặt được theo **giây/phút/giờ/ngày**, số từ **0** trở lên; `0` nghĩa là quay lại ngay (xuống cuối hàng). Hard/Good/Easy chỉ dùng phút/giờ/ngày, số từ 1 trở lên. Tối đa 365 ngày.
- Trong phiên học, thẻ vừa chấm **Again** luôn đứng sau các thẻ đang đến hạn; khi không còn thẻ nào khác, thẻ Again chờ sớm nhất được **hiện ngay** (không đếm ngược) nên các thẻ Again cứ xoay vòng cho tới khi bạn chấm mức khác. Thẻ Hard/Good/Easy vẫn đếm ngược đúng thời gian đã đặt, và thẻ hẹn từ 1 giờ trở lên thì rời phiên.
- Nhãn trên nút hiển thị đúng thời gian (`0s`, `15s`, `1m`, `10m`, `4d`...). Đặt Again quá ngắn (0 giây) nghĩa là bạn thấy lại đúng từ vừa quên ngay; nếu muốn có thẻ khác xen vào, đặt 10–30 giây.

## File đính kèm và dọn dẹp

Mỗi từ có thể kèm ảnh gợi nhớ, GIF nét viết (bạn tải lên) và audio phát âm (app tự sinh, tên file theo chữ Hán nên hai từ cùng chữ Hán dùng chung một audio). Chúng nằm trong `data/media/`.

App tự dọn để không để lại file thừa:

- **Xóa từ**: xóa luôn ảnh, GIF và audio của từ đó, trừ file mà từ khác còn dùng (vd audio dùng chung). Hộp thoại xác nhận có nhắc việc này.
- **Sửa từ**: ảnh/GIF bị thay hoặc bị xóa, và audio cũ khi đổi chữ Hán, được xóa nếu không còn từ nào dùng. File từ vẫn dùng thì giữ nguyên.
- **Lưu lỗi** (vd không sinh được audio): ảnh vừa tải lên bị bỏ, từ và file cũ giữ nguyên.
- Việc xóa file chỉ là bước phụ: nếu file đang bị khóa hay đã mất thì thao tác xóa/sửa từ vẫn thành công.
- Xóa là **xóa hẳn**, không có thùng rác: xóa nhầm từ thì ảnh tự tải lên cũng mất. Hãy sao lưu `data/` định kỳ.

File mồ côi từ trước (không từ nào dùng, hoặc audio do nút nghe thử và nút 🔊 câu ví dụ sinh ra; audio câu ví dụ là cache nên bị coi là mồ côi, xóa đi sẽ tự sinh lại khi bấm hoặc khi xuất) dọn bằng lệnh:

```bash
python backend/cleanup_media.py                              # chỉ LIỆT KÊ (mặc định), không xóa gì
python backend/cleanup_media.py --apply                      # xóa thật sự
python backend/cleanup_media.py --apply --min-age-minutes 0  # cả file mới tạo
```

Lệnh dùng cùng thư mục dữ liệu với app (`ANKITOOL_DATA_DIR` nếu có). Các lớp an toàn: bỏ qua file mới tạo trong 10 phút gần đây (có thể là ảnh vừa tải lên khi server đang chạy), từ chối `--apply` khi database không có từ nào mà media có file (tránh trỏ nhầm thư mục; ghi đè bằng `--allow-empty-db`), và chỉ đụng file thường nằm trực tiếp trong `media/`. Nên sao lưu `data/` rồi mới `--apply`.

## Khung trang (frontend)

- Bên trái là **menu chức năng** (`<aside id="sidebar">`); bên phải là `.app-main` gồm thanh trên cùng (nút ☰, tên chức năng đang mở, số từ) và các vùng chức năng `.tab-panel`.
- Màn hình rộng (> 900px): menu mở rộng 232px, nút ☰ thu gọn thành cột icon 68px; lựa chọn được nhớ trong `localStorage` (khóa `ankitool.sidebar.collapsed`).
- Màn hình hẹp (≤ 900px): menu là ngăn kéo, mặc định ẩn; ☰ mở ra đè lên nội dung, đóng khi chọn mục, bấm nền mờ hoặc nhấn `Esc`.
- Trạng thái nằm ở class trên `#app-shell` (`sidebar-collapsed`, `sidebar-open`), phần hiển thị do `css/sidebar.css` lo; `core/sidebar.js` chỉ đổi class. Biến CSS `--sidebar-current-w` cho các phần tử cố định (thanh chấm điểm ở tab Học) nằm đúng trong vùng nội dung.

## Pinyin câu ví dụ, màu theo thanh điệu và nút Ẩn/Hiện pinyin

- Form thêm/sửa từ có ô **Pinyin câu ví dụ** (tùy chọn). Quy tắc: mỗi chữ Hán của câu ví dụ đúng **một âm tiết**, cách nhau bằng dấu cách, có dấu thanh, thanh nhẹ không dấu, **không dấu câu**; phần trong ngoặc `(...)` / `（...）` (bản dịch) không tính. Ví dụ: `她是我的老师。(Cô ấy là giáo viên của tôi.)` ↔ `tā shì wǒ de lǎo shī`. Số âm tiết không khớp số chữ Hán thì server từ chối và nêu cả hai số.
- Ở mặt đáp án (xem trước, tab Học, thẻ Anki) câu ví dụ hiện dạng ruby: pinyin nhỏ nằm trên từng chữ Hán, chữ và pinyin cùng màu theo thanh; nút **🔤 Hiện pinyin / 🙈 Ẩn pinyin** bật tắt pinyin (mặc định **ẩn**, chữ vẫn có màu; sang thẻ mới lại ẩn). Từ không có pinyin ví dụ hiển thị như cũ và không có nút. Pinyin của từ chính (cả hai mặt) cũng tô màu theo thanh; chữ Hán của từ chính giữ nguyên màu.
- Bảng màu (nền trắng, tương phản ≥ 4,5:1): thanh 1 đỏ `#C62828`, thanh 2 xanh lá `#2E7D32`, thanh 3 xanh dương `#1565C0`, thanh 4 tím `#7B1FA2`, thanh nhẹ xám `#616161`. Khai báo ở `frontend/css/base.css` (`--tone-1…5`) và `backend/ankitool/constants/pinyin.py` — đổi thì sửa cả hai.
- **Nhập CSV**: cột tùy chọn `example_pinyin` (prompt cho AI đã yêu cầu cột này). Dòng có pinyin ví dụ không khớp vẫn được nhập nhưng **bỏ phần pinyin ví dụ**, có thông báo ở bước xem trước và ở báo cáo. CSV cũ (4 cột) vẫn nhập như trước. Nhập CSV bỏ qua từ đã có nên **không thể điền pinyin ví dụ hàng loạt cho từ cũ** — sửa từng từ ở form.
- **Thẻ Anki (.apkg)**: kiểu thẻ, trường và template giữ nguyên; HTML có màu và nút ẩn/hiện nằm trong nội dung hai trường `Pinyin` và `Example` (style nội tuyến, nút dùng thủ thuật checkbox, không cần JS). GUID của thẻ vẫn tính từ giá trị gốc của từ như trước nên nhập lại vào Anki cập nhật thẻ cũ thay vì tạo thẻ trùng (Anki có cập nhật hay không còn tùy phiên bản; chưa kiểm chứng trên Anki thật, mới kiểm tra nội dung file). Sửa thẻ trong trình soạn thảo của Anki có thể làm hỏng HTML nội tuyến.
- **Đọc cả câu ví dụ (🔊)**: ở mặt đáp án (xem trước và tab Học) có nút 🔊 cạnh nút Hiện/Ẩn pinyin, bấm thì đọc phần **tiếng Trung** của câu ví dụ (phần ngoài ngoặc `(...)`/`（...）`, nhiều dòng nối bằng dấu cách; bản dịch không được đọc; không có chữ Hán ngoài ngoặc thì không có nút). Audio sinh khi bấm (cần mạng, khoảng 1–3 giây, nút hiện ⏳), lưu thành file cache theo văn bản nên các lần sau phát ngay; không tự phát khi lật thẻ. Từ chính ở mặt đáp án không có nút này.
- **Âm thanh câu ví dụ trong thẻ Anki**: `[sound:…]` nằm trong trường `Example` (cạnh nút Hiện pinyin; với ví dụ không có pinyin thì ở dòng dưới câu). Lúc xuất, app sinh audio các câu chưa có, chạy 5 luồng song song và dùng lại file đã sinh khi bạn bấm 🔊 trong app. Đo thực tế: 30 câu mới ≈ 17 giây (tuần tự ≈ 3 giây/câu); hàng trăm câu mới cùng lúc có thể chạm `--timeout 120` của gunicorn (xuất lại là xong vì file đã sinh được giữ; hoặc nâng `--timeout` trong `Dockerfile`). Thiếu mạng thì xuất vẫn thành công, chỉ các thẻ chưa có audio câu ví dụ không có âm thanh. Anki tự phát âm thanh khi hiện đáp án (theo cài đặt "tự phát" của deck), nên có thể nghe cả từ lẫn câu.
- Mã dùng chung: `backend/ankitool/utils/pinyin.py` và `frontend/js/shared/pinyin.js` cài cùng một quy tắc ghép chữ ↔ âm tiết; sửa một bên thì sửa cả bên kia.

## Danh sách từ theo danh mục và xuất `.apkg` (tab Thêm từ mới)

- Ô **Xem theo danh mục** phía trên danh sách từ lọc theo: *Tất cả danh mục* (mặc định), *Chưa phân loại*, một danh mục cha "(tất cả)" (gồm mọi danh mục con) hoặc một danh mục con. Số từ ở danh sách và thanh trên cùng là số từ của phạm vi đang chọn.
- Nút **Xuất file .apkg (N từ)** chỉ xuất đúng N từ đang hiện trong danh sách; chọn *Tất cả danh mục* để xuất toàn bộ. Tên bộ thẻ tự điền theo tên danh mục (trừ khi bạn đã tự gõ tên); mỗi tên deck có id riêng nên các danh mục khác nhau thành các deck riêng khi nhập vào Anki (tên mặc định `MyChineseDeck` giữ id cũ).
- Form thêm/sửa từ có ô **Danh mục** (tùy chọn, chỉ danh mục con), tự chọn sẵn danh mục con đang lọc và được giữ lại sau khi lưu để nhập liên tiếp cho cùng một danh mục. Sửa từ có thể chuyển từ sang danh mục khác.
- API: `GET /api/words?category_id=<…>` và `GET /api/export?deck_name=<…>&category_id=<…>`; `category_id` để trống = tất cả, `uncategorized`, id danh mục cha (gồm các con) hoặc id danh mục con (cùng quy ước với tab Học). Form `POST/PUT /api/words` nhận thêm `category_id` (rỗng = chưa phân loại; `PUT` không gửi trường này thì giữ nguyên danh mục).

## Nhập hàng loạt từ CSV (dùng AI để tạo sẵn nội dung)

Ở tab **Thêm từ mới**, bấm **📥 Nhập từ CSV** để mở hộp thoại:

1. **Nhờ AI tạo CSV**: (tùy chọn) nhập danh sách từ, bấm **Sao chép prompt**, dán vào ChatGPT/Claude/... và lấy CSV trả về. App không tự gọi AI; prompt đã mô tả đúng định dạng cần nhập.
2. **Đưa CSV vào**: dán văn bản (cả khối <code>```csv ... ```</code> cũng được) hoặc chọn file `.csv`, bấm **Xem trước**.
3. **Xem trước**: bảng từng dòng với trạng thái *Hợp lệ / Trùng / Lỗi* kèm lý do; chưa lưu gì. Có thể quay lại sửa.
4. **Nhập**: bấm "Nhập N từ"; app lưu theo từng lô nhỏ (có thanh tiến trình, nút Hủy). Cuối cùng là báo cáo số từ đã tạo / trùng / lỗi / chưa xử lý và lý do. Đóng hộp thoại thì danh sách từ tự cập nhật.

Định dạng CSV:

- Dòng đầu là tiêu đề với cột `hanzi`, `pinyin`, `meaning` (bắt buộc) và `example`, `example_pinyin` (tùy chọn); không phân biệt hoa/thường và thứ tự cột. Cột lạ (như `gif`) bị bỏ qua và được báo.
- Dấu phân cách `,` `;` hoặc Tab; trường có dấu phân cách, dấu nháy kép hay xuống dòng phải đặt trong ngoặc kép `"..."` (nháy kép bên trong viết `""`). Dòng có nhiều giá trị hơn số cột (thường do quên ngoặc kép) bị báo lỗi thay vì nhập sai.
- UTF-8 (BOM được chấp nhận); dòng trống bị bỏ qua.
- Giới hạn: 500 dòng dữ liệu và 1 MB mỗi lần nhập.

Quy tắc: từ trùng chữ Hán với từ đã có (hoặc với dòng trước đó trong cùng file) bị **bỏ qua**, từ cũ không bao giờ bị ghi đè; từ nhập vào giống từ thêm bằng form (có âm thanh, là từ mới đến hạn học ngay, chưa có ảnh — thêm ảnh bằng cách sửa từ; mặc định chưa phân loại, hoặc nằm trong danh mục con bạn chọn ở ô **Nhập vào danh mục** của hộp thoại, áp cho cả lần nhập). Nhập lại cùng một file là an toàn vì chỉ những từ chưa có mới được tạo. Âm thanh sinh qua mạng (edge-tts), thực đo khoảng 0,7 giây mỗi từ mới.

API (dùng bởi giao diện): `POST /api/words/import/preview` (`{"csv": "..."}` → `rows`, `summary`, `warnings`; không ghi gì) và `POST /api/words/import` (`{"rows": [{"row","hanzi","pinyin","meaning","example"}], "category_id": "<id danh mục con, tùy chọn>"}`, tối đa 20 dòng mỗi lần → `results`, `summary`). Mọi kiểm tra (thiếu trường, trùng, giới hạn) do server làm.

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
