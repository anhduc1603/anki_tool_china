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
    ├── services/                # luật nghiệp vụ: word, word_import (nhập CSV), category, study, settings, media, image_suggestion (gợi ý ảnh), export + scheduler (SM-2 thuần)
    ├── integrations/            # thư viện ngoài: tts.py (edge-tts), image_search.py (Wikimedia Commons, Openverse), anki/ (genanki: card_template, deck_builder)
    ├── controllers/             # Flask Blueprint mỏng: page, word, word_import, category, study, settings, media, image, export
    ├── errors.py                # AppError / ValidationError (400) / NotFoundError (404) + handler -> JSON
    ├── utils/clock.py           # thời gian địa phương cho lịch ôn
    └── cli/                     # csv_import.py (logic generate_anki.py), cleanup_media.py (logic cleanup_media.py)
frontend/
├── index.html                   # khung trang: menu trái + thanh trên cùng + 5 trang (Tổng quan, Học, Từ vựng, Thêm từ, Cài đặt) + hộp thoại nhập CSV
├── manifest.webmanifest, img/   # cài lên màn hình chính (manifest + icon; icon sinh bằng backend/make_app_icons.py)
├── css/                         # tokens (biến thiết kế), base, components (nút, ô nhập, switch, toast, hộp thoại...), forms, sidebar, overview, library, add-word, import, study, settings, touch
└── js/
    ├── main.js                  # điểm vào, khởi tạo từng feature; initTabs() chạy cuối cùng
    ├── constants.js             # tên sự kiện, id trang, bảng ROUTES (địa chỉ #...), hằng số FE
    ├── core/                    # events, tabs (định tuyến theo hash), sidebar, store (kho dữ liệu chung), word-scope (lọc/đếm thuần), dialog + toast (thay alert/confirm/prompt), icons (SVG), http
    ├── api/                     # mỗi nhóm API một file (words, categories, study, settings, tts)
    ├── shared/                  # dom.js (escapeHtml), audio.js (phát âm), pinyin.js, example-view.js
    └── features/                # overview/, study/, library/, add-word/, import/ (hộp thoại nhập CSV), settings/
data/                            # dữ liệu chạy thật (không đưa lên git)
openspec/                        # đặc tả và các thay đổi (OpenSpec)
```

## Cài đặt thời gian ôn lại (trang Cài đặt)

Với từ mới hoặc từ vừa quên (đang ở giai đoạn học), mỗi mức chấm điểm quay lại sau một khoảng bạn chọn; từ đã thuộc (Good/Easy) thì các lần sau tự giãn theo ngày. Mặc định: Again 1 phút, Hard 6 phút, Good 10 phút, Easy 4 ngày.

- **Again** đặt được theo **giây/phút/giờ/ngày**, số từ **0** trở lên; `0` nghĩa là quay lại ngay (xuống cuối hàng). Hard/Good/Easy chỉ dùng phút/giờ/ngày, số từ 1 trở lên. Tối đa 365 ngày.
- Trong phiên học, thẻ vừa chấm **Again** luôn đứng sau các thẻ đang đến hạn; khi không còn thẻ nào khác, thẻ Again chờ sớm nhất được **hiện ngay** (không đếm ngược) nên các thẻ Again cứ xoay vòng cho tới khi bạn chấm mức khác. Thẻ Hard/Good/Easy vẫn đếm ngược đúng thời gian đã đặt, và thẻ hẹn từ 1 giờ trở lên thì rời phiên.
- Nhãn trên nút hiển thị đúng thời gian (`0s`, `15s`, `1m`, `10m`, `4d`...). Đặt Again quá ngắn (0 giây) nghĩa là bạn thấy lại đúng từ vừa quên ngay; nếu muốn có thẻ khác xen vào, đặt 10–30 giây.

## Giao diện học kiểu Anki (trang Học)

- **Nền phẳng, đáp án lật mở xuống**: câu hỏi (chữ Hán, pinyin, nút loa) luôn nằm trên. **Không có nút "Hiện đáp án"**: **chạm (click) vào bất kỳ đâu trên màn hình học** (trên thẻ hoặc vùng trống quanh thẻ) hoặc bấm `Space`/`Enter` thì đáp án (nghĩa, ví dụ, ảnh, GIF) hiện ngay **bên dưới**, ngăn bằng một đường kẻ, và trang cuộn tới đáp án; chạm lần hai không làm gì, chạm vào thanh dưới, ô chọn phạm vi, menu Thêm, nút loa/Hiện pinyin hay ô gõ thì chỉ làm việc của chúng, không hiện đáp án; khi không có thẻ nào (hết từ/đang chờ) chạm không làm gì. Khi đáp án còn ẩn thẻ có dòng gợi ý và con trỏ bàn tay. Khi hiện, khối đáp án **lật mở xuống từ cạnh trên** (khoảng 0,45 giây, vừa xoay vừa hiện dần), câu hỏi đứng yên; tắt hoạt ảnh nếu hệ điều hành bật "giảm chuyển động". Xem trước ở tab Thêm từ mới vẫn lật như cũ.
- **Thanh dưới 3 vùng**: **Sửa từ** (trái) | bộ đếm + **4 nút chấm Again/Hard/Good/Easy kèm thời gian dự kiến, luôn hiện ngay khi từ xuất hiện** (giữa) | **Thêm ▾** và nhãn "Tự chuyển" khi đang bật (phải). Màn hình hẹp (≤ 583 px): hai nút bên thu thành biểu tượng.
- **Bộ đếm 3 màu**: New (xanh dương) + Learn (đỏ) + Review (xanh lá) cho phạm vi đang học, **gạch chân** loại của thẻ đang hiện; tính cả thẻ đang chờ quay lại, cập nhật sau mỗi lần chấm/hoãn. Phân loại như tab Danh mục: New = chưa ôn lần nào; Learn = đã ôn nhưng còn đang học; Review = đã tốt nghiệp (`repetitions > 0`). Lưu ý: một từ mới chấm Good đã có `repetitions > 0` nên được đếm vào Review dù còn đang chờ 10 phút.
- **Phím tắt** (chỉ khi trang Học đang hiện và bạn không gõ trong ô nhập): `Space`/`Enter` hiện đáp án, khi đã hiện thì chấm **Good**; `1`–`4` chấm Again/Hard/Good/Easy **ngay, không cần hiện đáp án**; `R` nghe lại (mặt câu hỏi: từ; mặt đáp án: câu ví dụ nếu có, không thì từ); `Shift+A` bật/tắt tự chuyển thẻ; `-` hoãn thẻ; `E` sửa từ. Cẩn thận: bấm `Space` hai lần liên tiếp sẽ chấm Good luôn (giống Anki).
- **Vuốt chấm ngay** (cảm ứng hoặc kéo chuột, bắt đầu từ bất kỳ đâu trên màn hình học ngoài các vùng điều khiển): ngay khi từ xuất hiện, **vuốt phải = Good, vuốt trái = Again**, không cần xem đáp án; chấm cả khi đã hiện đáp án. Kéo đủ xa (80 px) thì thẻ **viền xanh + nhãn Good** (phải) hoặc **viền đỏ + nhãn Again** (trái), kéo ngược lại thì mất. Hard và Easy dùng nút hoặc phím 2 và 4. Phân biệt bằng độ dịch chuyển của con trỏ: ≤ 10 px là chạm (hiện đáp án), kéo ngang ≥ 80 px là vuốt chấm, kéo ngắn hoặc kéo dọc (cuộn trang) không làm gì. Chấm khi chưa xem đáp án là chủ đích nên không có bước xác nhận và chưa có hoàn tác.
- **Sửa từ**: nút Sửa từ hoặc phím `E` mở trang Thêm từ với từ đang học nạp sẵn vào form (có nút "Về Từ vựng"); quay lại trang Học thì phiên nạp lại dữ liệu mới.
- **Menu Thêm ▾**: Hoãn thẻ, Nghe lại, Tự chuyển thẻ (có dấu ✓ khi bật). Đóng bằng bấm ra ngoài hoặc `Escape`.
- **Hoãn thẻ (bury)**: từ bị hoãn không xuất hiện trong phiên và không bị đếm (kể cả ở Tổng quan) **đến hết hôm nay**, ngày mai tự quay lại; lịch ôn (ease/interval/lần ôn/ngày đến hạn) không đổi. Cột `buried_until` trong bảng `words` (tự thêm khi khởi động lại app; từ cũ để trống). Màn "hết từ" báo "Có N từ đã hoãn đến ngày mai" kèm nút **Bỏ hoãn**. API: `POST /api/study/bury/<id>`, `GET /api/study/buried?category_id=`, `POST /api/study/unbury` (`{"category_id": ...}` tùy chọn).
- **Tự chuyển thẻ (auto-advance)**: bật/tắt bằng `Shift+A` hoặc menu (chỉ cho phiên hiện tại, **mặc định tắt mỗi lần tải trang**). Cài đặt (trang Cài đặt → "Tự chuyển thẻ", khóa `study_auto_advance`): sau **N giây** ở câu hỏi thì hiện đáp án, sau **M giây** ở đáp án thì làm hành động đã chọn (chấm Again/Hard/Good, hoãn thẻ, hoặc chỉ nhắc — **mặc định chỉ nhắc**); 0 giây = bỏ bước đó (mặc định 10/10); tùy chọn chờ âm thanh đọc xong (tối đa 30 giây). Tự tắt khi rời trang Học hoặc khi trang bị ẩn; thao tác thủ công huỷ hẹn giờ đang chạy.
- **Gõ đáp án (pinyin)** (trang Cài đặt → "Gõ đáp án", khóa `study_type_answer`, **mặc định tắt**): mặt câu hỏi ẩn pinyin và có ô gõ, `Enter` hiện đáp án. So khớp **bỏ qua dấu thanh, hoa/thường, khoảng trắng** và coi `v` = `ü`, theo từng chữ cái (dãy con chung dài nhất): chữ đúng tô **xanh**, chữ gõ sai **đỏ**, chữ thiếu **xám**; khớp hoàn toàn thì chỉ một dòng xanh có đủ dấu thanh. Chỉ để tham khảo, **không tự chấm điểm**.
- **Chưa làm so với Anki**: cờ màu, đánh dấu sao, tạm dừng thẻ (suspend), hoàn tác, thông tin thẻ, đồng hồ trên thẻ, nhắc nghỉ, ghi âm giọng, gõ chữ Hán, giới hạn thẻ mỗi ngày, màn hình tổng quan deck.

## Tự động đọc khi học (trang Cài đặt → "Tự động đọc")

Hai công tắc, **mặc định bật**, lưu trên server (khóa `study_autoplay`, dùng chung mọi thiết bị) và có hiệu lực từ lần mở trang Học kế tiếp; đổi là lưu ngay:

- **Tự đọc từ khi sang thẻ mới**: mỗi lần một thẻ hiện ra (đầu phiên, sau khi chấm điểm, thẻ chờ quay lại, đổi phạm vi) đọc chữ Hán của từ. Hiện đáp án không đọc lại từ.
- **Tự đọc câu ví dụ khi hiện đáp án**: đọc phần tiếng Trung của câu ví dụ (cùng quy tắc với nút loa câu ví dụ). Ngay khi thẻ xuất hiện app sinh trước audio câu này để lúc hiện đáp án nghe gần như tức thì; công tắc tắt thì không sinh trước.
- Chỉ tự đọc khi **trang Học đang hiện và trang đang được xem**; rời trang thì âm thanh dừng, thẻ xuất hiện khi bạn ở trang khác (hoặc tab trình duyệt khác) không được đọc. Chấm điểm nhanh không đọc chồng và không đọc nhầm thẻ cũ. Xem trước ở tab Thêm từ mới không bao giờ tự phát.
- Tự đọc bị trình duyệt chặn hoặc không sinh được âm thanh thì **không báo lỗi**; nút loa thủ công vẫn dùng như cũ (và vẫn báo lỗi). Trình duyệt thường chỉ cho tự phát sau khi bạn đã bấm gì đó trên trang; iPhone/Safari có thể chặn nhiều hơn, khi đó bấm 🔊 một lần để "mở khóa" âm thanh.
- Phần mềm Anki có cài đặt phát âm riêng ở deck (Options → Audio → Don't play audio automatically), nên không đổi gì ở file `.apkg`.

## File đính kèm và dọn dẹp

Mỗi từ có thể kèm ảnh gợi nhớ, GIF nét viết (bạn tải lên) và audio phát âm (app tự sinh, tên file theo chữ Hán nên hai từ cùng chữ Hán dùng chung một audio). Chúng nằm trong `data/media/`.

App tự dọn để không để lại file thừa:

- **Xóa từ**: xóa luôn ảnh, GIF và audio của từ đó, trừ file mà từ khác còn dùng (vd audio dùng chung). Hộp thoại xác nhận có nhắc việc này.
- **Sửa từ**: ảnh/GIF bị thay hoặc bị xóa, và audio cũ khi đổi chữ Hán, được xóa nếu không còn từ nào dùng. File từ vẫn dùng thì giữ nguyên.
- **Lưu lỗi** (vd không sinh được audio): ảnh vừa tải lên bị bỏ, từ và file cũ giữ nguyên.
- Việc xóa file chỉ là bước phụ: nếu file đang bị khóa hay đã mất thì thao tác xóa/sửa từ vẫn thành công.
- Xóa là **xóa hẳn**, không có thùng rác: xóa nhầm từ thì ảnh tự tải lên cũng mất. Hãy sao lưu `data/` định kỳ.

File mồ côi từ trước (không từ nào dùng, hoặc audio do nút nghe thử và nút loa câu ví dụ sinh ra; audio câu ví dụ là cache nên bị coi là mồ côi, xóa đi sẽ tự sinh lại khi bấm hoặc khi xuất) dọn bằng lệnh:

```bash
python backend/cleanup_media.py                              # chỉ LIỆT KÊ (mặc định), không xóa gì
python backend/cleanup_media.py --apply                      # xóa thật sự
python backend/cleanup_media.py --apply --min-age-minutes 0  # cả file mới tạo
```

Lệnh dùng cùng thư mục dữ liệu với app (`ANKITOOL_DATA_DIR` nếu có). Các lớp an toàn: bỏ qua file mới tạo trong 10 phút gần đây (có thể là ảnh vừa tải lên khi server đang chạy), từ chối `--apply` khi database không có từ nào mà media có file (tránh trỏ nhầm thư mục; ghi đè bằng `--allow-empty-db`), và chỉ đụng file thường nằm trực tiếp trong `media/`. Nên sao lưu `data/` rồi mới `--apply`.

## Cấu trúc trang và giao diện (frontend)

Năm trang, mỗi trang có địa chỉ riêng trên URL (tải lại ở đâu ở đó, nút Back/Forward của trình duyệt đổi trang; địa chỉ sai thì về Tổng quan):

| Trang | Địa chỉ | Việc chính |
|---|---|---|
| **Tổng quan** (mở đầu) | `#overview` | Hôm nay cần học bao nhiêu (Mới / Đang học / Ôn lại) và nút **Học ngay**; bảng bộ thẻ theo danh mục (bấm tên để học); kho từ (chưa học / đang học / đã thuộc, đã thuộc = khoảng ôn từ 21 ngày); lối tắt Thêm từ, Nhập CSV; người dùng chưa có từ nào thấy 3 bước bắt đầu |
| **Học** | `#study` | Học bằng thẻ (xem mục "Giao diện học kiểu Anki") |
| **Từ vựng** | `#words` | Cây danh mục bên trái (thêm danh mục, ⚙ đổi tên/thêm con/xóa), bảng từ của danh mục đang chọn bên phải (đổi danh mục ngay trong dòng, nghe/sửa/xóa), thanh công cụ **Thêm từ · Nhập từ CSV · Xuất sang Anki (.apkg)** |
| **Thêm từ** (nút trên menu) | `#add` | Form chia 3 nhóm + xem trước thẻ; cũng là trang **Sửa từ** (mở từ Từ vựng hoặc từ trang Học) |
| **Cài đặt** | `#settings` | Nhóm "Lịch ôn tập" và "Khi học" |

- **Menu và khung**: bên trái là menu (`<aside id="sidebar">`), bên phải là `.app-main` gồm thanh trên cùng (nút menu + tên trang) và `<main>` chứa các `.tab-panel`. Màn hình rộng (> 900px): menu 240px, nút menu thu gọn thành cột icon 72px, lựa chọn nhớ trong `localStorage` (khóa `ankitool.sidebar.collapsed`). Màn hình hẹp (≤ 900px): menu là ngăn kéo, đóng khi chọn mục, bấm nền mờ hoặc nhấn `Esc`. Biến CSS `--sidebar-current-w` giúp thanh chấm điểm cố định của trang Học nằm đúng trong vùng nội dung.
- **Dữ liệu dùng chung**: `core/store.js` giữ danh mục, từ, số thẻ đến hạn, danh mục đang chọn ở trang Từ vựng; mỗi trang gọi `loadAll()` khi được mở và sau mỗi thay đổi, rồi vẽ lại khi nhận `DATA_CHANGED`. Việc lọc/đếm từ theo danh mục chạy ở trình duyệt (`core/word-scope.js`, cùng quy tắc với `resolve_scope` của server); xuất `.apkg` vẫn do server lọc.
- **Chọn nhiều từ ở trang Từ vựng**: mỗi dòng có ô chọn (đầu cột có ô "chọn tất cả từ đang hiển thị"; giữ **Shift** khi bấm để chọn cả khoảng). Khi có từ được chọn hiện thanh thao tác: chọn danh mục đích (hoặc *Chưa phân loại*) rồi **Chuyển**, cả nhóm đổi danh mục trong một yêu cầu (hoặc cùng đổi hoặc không từ nào đổi). Lựa chọn chỉ áp cho các từ đang hiển thị và bị bỏ khi đổi danh mục xem. API: `POST /api/words/assign-category` với `{"word_ids": [...], "category_id": "<id danh mục con>" | null}` (tối đa 1000 từ) → `{updated, missing}`.
- **Hệ thống thiết kế**: biến màu/chữ/khoảng cách/bo góc/bóng/vòng focus nằm ở `css/tokens.css` (màu chủ đạo chàm; đỏ chỉ dùng cho nghĩa "lỗi/Again" và dấu "ấn" của logo; màu thanh điệu và bộ đếm giữ nguyên). Thành phần dùng chung ở `css/components.css`; icon là bộ SVG trong `index.html` (`<svg id="icon-sprite">`) gọi bằng `icon("tên")` trong `core/icons.js`. **Không dùng `alert`/`confirm`/`prompt`**: xác nhận và nhập tên dùng `confirmDialog`/`promptDialog` (`core/dialog.js`), kết quả báo bằng `toast` (`core/toast.js`).
- **Responsive và trợ năng**: ≤ 1100px cây danh mục ở trang Từ vựng thành ô chọn; ≤ 900px menu là ngăn kéo và trang hai phần xếp chồng; ≤ 600px bảng từ thành thẻ; trên màn hình cảm ứng mọi nút cao ≥ 44px (`css/touch.css`). Tương phản chữ ≥ 4,5:1 (`--text-muted` v.v.), vòng focus rõ, thao tác được bằng bàn phím, có liên kết "Bỏ qua tới nội dung", tôn trọng "giảm chuyển động".
- **Cài lên màn hình chính**: app có `manifest.webmanifest` và icon (`frontend/img/`). Chrome/Edge: menu trình duyệt → "Cài đặt AnkiTool" hoặc "Thêm vào màn hình chính" (cần HTTPS hoặc `localhost`); iPhone: Chia sẻ → Thêm vào MH chính. Không có service worker nên **không dùng offline**. Khi trang đặt sau đăng nhập (Caddy `basicauth`), thẻ `<link rel="manifest">` có `crossorigin="use-credentials"` để trình duyệt gửi thông tin đăng nhập khi lấy manifest. Đổi icon: chạy `python backend/make_app_icons.py` (cần Pillow và font có chữ Hán).
- Sau khi cập nhật code, nếu giao diện còn kiểu cũ hoặc lỗi lạ, bấm **Ctrl+F5** (trình duyệt có thể giữ bản cũ của các file JS/CSS).

## Pinyin câu ví dụ, màu theo thanh điệu và nút Ẩn/Hiện pinyin

- Form thêm/sửa từ có ô **Pinyin câu ví dụ** (tùy chọn). Quy tắc: mỗi chữ Hán của câu ví dụ đúng **một âm tiết**, cách nhau bằng dấu cách, có dấu thanh, thanh nhẹ không dấu, **không dấu câu**; phần trong ngoặc `(...)` / `（...）` (bản dịch) không tính. Ví dụ: `她是我的老师。(Cô ấy là giáo viên của tôi.)` ↔ `tā shì wǒ de lǎo shī`. Số âm tiết không khớp số chữ Hán thì server từ chối và nêu cả hai số.
- Ở mặt đáp án (xem trước, trang Học, thẻ Anki) câu ví dụ hiện dạng ruby: pinyin nhỏ nằm trên từng chữ Hán, chữ và pinyin cùng màu theo thanh; nút **Hiện pinyin / Ẩn pinyin** bật tắt pinyin (mặc định **ẩn**, chữ vẫn có màu; sang thẻ mới lại ẩn). Từ không có pinyin ví dụ hiển thị như cũ và không có nút. Pinyin của từ chính (cả hai mặt) cũng tô màu theo thanh; chữ Hán của từ chính giữ nguyên màu.
- Bảng màu (nền trắng, tương phản ≥ 4,5:1): thanh 1 đỏ `#C62828`, thanh 2 xanh lá `#2E7D32`, thanh 3 xanh dương `#1565C0`, thanh 4 tím `#7B1FA2`, thanh nhẹ xám `#616161`. Khai báo ở `frontend/css/base.css` (`--tone-1…5`) và `backend/ankitool/constants/pinyin.py` — đổi thì sửa cả hai.
- **Nhập CSV**: cột tùy chọn `example_pinyin` (prompt cho AI đã yêu cầu cột này). Dòng có pinyin ví dụ không khớp vẫn được nhập nhưng **bỏ phần pinyin ví dụ**, có thông báo ở bước xem trước và ở báo cáo. CSV cũ (4 cột) vẫn nhập như trước. Nhập CSV bỏ qua từ đã có nên **không thể điền pinyin ví dụ hàng loạt cho từ cũ** — sửa từng từ ở form.
- **Thẻ Anki (.apkg)**: kiểu thẻ, trường và template giữ nguyên; HTML có màu và nút ẩn/hiện nằm trong nội dung hai trường `Pinyin` và `Example` (style nội tuyến, nút dùng thủ thuật checkbox, không cần JS). GUID của thẻ vẫn tính từ giá trị gốc của từ như trước nên nhập lại vào Anki cập nhật thẻ cũ thay vì tạo thẻ trùng (Anki có cập nhật hay không còn tùy phiên bản; chưa kiểm chứng trên Anki thật, mới kiểm tra nội dung file). Sửa thẻ trong trình soạn thảo của Anki có thể làm hỏng HTML nội tuyến.
- **Đọc cả câu ví dụ (nút loa)**: ở mặt đáp án (xem trước và trang Học) có nút loa cạnh nút Hiện/Ẩn pinyin, bấm thì đọc phần **tiếng Trung** của câu ví dụ (phần ngoài ngoặc `(...)`/`（...）`, nhiều dòng nối bằng dấu cách; bản dịch không được đọc; không có chữ Hán ngoài ngoặc thì không có nút). Audio sinh khi bấm (cần mạng, khoảng 1–3 giây, nút hiện biểu tượng đang tải), lưu thành file cache theo văn bản nên các lần sau phát ngay; không tự phát khi hiện đáp án (trừ khi bật Tự động đọc). Từ chính ở mặt đáp án không có nút này.
- **Âm thanh câu ví dụ trong thẻ Anki**: `[sound:…]` nằm trong trường `Example` (cạnh nút Hiện pinyin; với ví dụ không có pinyin thì ở dòng dưới câu). Lúc xuất, app sinh audio các câu chưa có, chạy 5 luồng song song và dùng lại file đã sinh khi bạn bấm nút loa trong app. Đo thực tế: 30 câu mới ≈ 17 giây (tuần tự ≈ 3 giây/câu); hàng trăm câu mới cùng lúc có thể chạm `--timeout 120` của gunicorn (xuất lại là xong vì file đã sinh được giữ; hoặc nâng `--timeout` trong `Dockerfile`). Thiếu mạng thì xuất vẫn thành công, chỉ các thẻ chưa có audio câu ví dụ không có âm thanh. Anki tự phát âm thanh khi hiện đáp án (theo cài đặt "tự phát" của deck), nên có thể nghe cả từ lẫn câu.
- Mã dùng chung: `backend/ankitool/utils/pinyin.py` và `frontend/js/shared/pinyin.js` cài cùng một quy tắc ghép chữ ↔ âm tiết; sửa một bên thì sửa cả bên kia.

## Danh sách từ theo danh mục và xuất `.apkg` (trang Từ vựng)

- **Cây danh mục** bên trái bảng từ (trên màn hình hẹp là ô chọn) lọc theo: *Tất cả từ* (mặc định), *Chưa phân loại*, một danh mục cha (gồm mọi danh mục con) hoặc một danh mục con; mỗi mục có số từ. Lựa chọn được nhớ khi bạn sang trang khác trong cùng lần mở app.
- Nút **Xuất sang Anki (.apkg) · N từ** trên thanh công cụ chỉ xuất đúng N từ của mục đang chọn (bấm nút để mở khung nhập tên bộ thẻ rồi **Tải file .apkg**); chọn *Tất cả từ* để xuất toàn bộ, mục rỗng thì nút bị vô hiệu. Tên bộ thẻ tự điền theo tên danh mục (trừ khi bạn đã tự gõ tên); mỗi tên deck có id riêng nên các danh mục khác nhau thành các deck riêng khi nhập vào Anki (tên mặc định `MyChineseDeck` giữ id cũ).
- Form thêm/sửa từ có ô **Danh mục** (tùy chọn, chỉ danh mục con), tự chọn sẵn danh mục con đang chọn ở trang Từ vựng và được giữ lại sau khi lưu để nhập liên tiếp cho cùng một danh mục. Sửa từ có thể chuyển từ sang danh mục khác; ở trang Từ vựng còn đổi danh mục ngay trong dòng của bảng (không còn panel "Gán từ vào danh mục").
- API: `GET /api/words?category_id=<…>` và `GET /api/export?deck_name=<…>&category_id=<…>`; `category_id` để trống = tất cả, `uncategorized`, id danh mục cha (gồm các con) hoặc id danh mục con (cùng quy ước với trang Học). Form `POST/PUT /api/words` nhận thêm `category_id` (rỗng = chưa phân loại; `PUT` không gửi trường này thì giữ nguyên danh mục).

## Nhập hàng loạt từ CSV (dùng AI để tạo sẵn nội dung)

Bấm **Nhập từ CSV** ở trang **Từ vựng**, **Tổng quan** hoặc **Thêm từ** để mở hộp thoại (đóng xong bạn vẫn ở trang đang dùng):

1. **Nhờ AI tạo CSV**: (tùy chọn) nhập danh sách từ, bấm **Sao chép prompt**, dán vào ChatGPT/Claude/... và lấy CSV trả về. App không tự gọi AI; prompt đã mô tả đúng định dạng cần nhập.
2. **Đưa CSV vào**: dán văn bản (cả khối <code>```csv ... ```</code> cũng được) hoặc chọn file `.csv`, bấm **Xem trước**.
3. **Xem trước**: bảng từng dòng với trạng thái *Hợp lệ / Trùng / Lỗi* kèm lý do; chưa lưu gì. Có thể quay lại sửa.
4. **Nhập**: bấm "Nhập N từ"; app lưu theo từng lô nhỏ (có thanh tiến trình, nút Hủy). Cuối cùng là báo cáo số từ đã tạo / trùng / lỗi / chưa xử lý và lý do. Đóng hộp thoại thì các trang tự cập nhật.

**Từ ảnh chụp sách**: ở bước 1 của hộp thoại có thêm nút **Sao chép prompt chụp sách** (xem nội dung ở mục bên dưới nút). Dán prompt vào ChatGPT/Claude/Gemini (bản đọc được ảnh), đính kèm **ảnh tất cả trang của một bài**, AI đọc ảnh, lấy toàn bộ bảng "Từ mới / 词语表" (và tùy chọn tên riêng, vài từ quan trọng ngoài bảng) rồi trả hai khối: CSV và ghi chú (từ đọc chưa chắc, từ đã thêm/bỏ). **Chỉ chép khối CSV** dán vào ô CSV, rồi xem lại ở bước Xem trước. Ba dòng "TÙY CHỌN" ở đầu prompt (tên riêng, số từ ngoài bảng, âm Hán Việt) sửa ngay trong khung chat trước khi gửi. Nên gửi từng bài một; chữ nhỏ hoặc mờ có thể bị đọc sai.

Định dạng CSV:

- Dòng đầu là tiêu đề với cột `hanzi`, `pinyin`, `meaning` (bắt buộc) và `example`, `example_pinyin` (tùy chọn); không phân biệt hoa/thường và thứ tự cột. Cột lạ (như `gif`) bị bỏ qua và được báo.
- Dấu phân cách `,` `;` hoặc Tab; trường có dấu phân cách, dấu nháy kép hay xuống dòng phải đặt trong ngoặc kép `"..."` (nháy kép bên trong viết `""`). Dòng có nhiều giá trị hơn số cột (thường do quên ngoặc kép) bị báo lỗi thay vì nhập sai.
- UTF-8 (BOM được chấp nhận); dòng trống bị bỏ qua.
- Giới hạn: 500 dòng dữ liệu và 1 MB mỗi lần nhập.

Quy tắc: từ trùng chữ Hán với từ đã có (hoặc với dòng trước đó trong cùng file) bị **bỏ qua**, từ cũ không bao giờ bị ghi đè; từ nhập vào giống từ thêm bằng form (có âm thanh, là từ mới đến hạn học ngay, chưa có ảnh — thêm ảnh bằng cách sửa từ; mặc định chưa phân loại, hoặc nằm trong danh mục con bạn chọn ở ô **Nhập vào danh mục** của hộp thoại, áp cho cả lần nhập). Nhập lại cùng một file là an toàn vì chỉ những từ chưa có mới được tạo. Âm thanh sinh qua mạng (edge-tts), thực đo khoảng 0,7 giây mỗi từ mới.

API (dùng bởi giao diện): `POST /api/words/import/preview` (`{"csv": "..."}` → `rows`, `summary`, `warnings`; không ghi gì) và `POST /api/words/import` (`{"rows": [{"row","hanzi","pinyin","meaning","example"}], "category_id": "<id danh mục con, tùy chọn>"}`, tối đa 20 dòng mỗi lần → `results`, `summary`). Mọi kiểm tra (thiếu trường, trùng, giới hạn) do server làm.

## Gợi ý ảnh minh hoạ cho từ (trang Thêm từ)

Ở khối **Ảnh gợi nhớ** của form thêm/sửa từ, app tìm ảnh miễn phí giúp bạn:

- **Tự tìm** khi bạn nhập nghĩa của từ **mới** rồi rời ô nghĩa (nếu từ chưa có ảnh); hoặc bấm **Tìm ảnh minh hoạ**. Ô **Từ khóa tìm ảnh** tự điền từ nghĩa (phần trước dấu phẩy/ngoặc), sửa được; **thử từ tiếng Anh nếu ít kết quả**.
- **Từ khóa gửi đi = từ khóa của bạn + `illustration`** (server tự thêm, bạn không thấy trong ô; hằng `SEARCH_SUFFIX` ở `backend/ankitool/constants/image_search.py`, xóa chuỗi đó để tìm đúng từ khóa) nhằm ra tranh minh hoạ thay vì ảnh chụp bất kỳ.
- Hiện tối đa 6 ảnh nhỏ, bấm một ảnh để dùng (vào ô Ảnh gợi nhớ như ảnh bạn dán tay: xem trước, lưu cùng từ, hiện ở mặt đáp án và trong thẻ Anki). **App không bao giờ tự gắn ảnh**; ảnh bạn đã dán/chọn không bị ghi đè khi tự tìm. Bấm "Xóa ảnh" để bỏ.
- **Nguồn ảnh**: Wikimedia Commons (chính, nhanh) và Openverse (bổ sung khi Commons cho dưới 4 ảnh; ẩn danh khá chậm, 15–20 giây). Chỉ lấy ảnh có giấy phép cho dùng lại và chỉnh sửa (CC0, Public Domain, CC BY, CC BY-SA). Tên tác giả, giấy phép và liên kết nguồn được lưu kèm từ (cột `mnemonic_credit`) và hiện dưới ảnh trong form. Ảnh CC BY/CC BY-SA yêu cầu ghi công nếu bạn **chia sẻ** thẻ cho người khác; thẻ Anki xuất ra không tự in dòng ghi công.
- **Server làm việc gọi mạng** (cần ra được `commons.wikimedia.org`, `api.openverse.org`, `upload.wikimedia.org`, `thumb.wikimedia.org`; VPS chặn mạng ra ngoài thì gợi ý báo "tạm thời không tìm được", các phần khác vẫn chạy). Trình duyệt chỉ nhận ảnh qua server của bạn (`GET /api/images/search?q=&source=commons|openverse`, `GET /api/images/<token>/file`); server chỉ tải ảnh do chính nó liệt kê trong lần tìm gần đây (không tải địa chỉ tùy ý), chỉ `https`, chỉ host Wikimedia/Openverse (kể cả sau chuyển hướng), tối đa 3 MB, chỉ JPEG/PNG/GIF/WebP (không SVG). Ảnh lưu là bản thu nhỏ (~ 640–960 px).
- Khoá Openverse là **tùy chọn**: đặt biến môi trường `OPENVERSE_CLIENT_ID` và `OPENVERSE_CLIENT_SECRET` (đăng ký miễn phí ở openverse.org) nếu bị giới hạn lượt khi dùng ẩn danh.
- **Chất lượng (đo thật ngày 2026-10-25, chỉ trên Commons)**: danh từ cụ thể bằng tiếng Anh ra ảnh hợp ("apple", "dog"); tiếng Việt cho kết quả lẫn lộn ("quả táo" ra mâm ngũ quả, "con chó" ra ảnh không liên quan); từ trừu tượng ("vì vậy", "chạy", "happy") gần như không có ảnh hợp. Tìm liên tục nhiều từ trong vài giây có thể bị Commons giới hạn tạm thời (app báo "tạm thời không tìm được"). Nếu chất lượng này chưa đủ, hướng tiếp theo là dịch từ khóa sang tiếng Anh tự động hoặc nhờ AI vẽ ảnh (cần khoá API, có phí).
- Chưa tự tìm ảnh cho từ nhập CSV hoặc từ cũ; mở từ ra sửa để tìm ảnh cho từng từ.

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
- Hàm dùng chung đặt trong `js/shared/`; dữ liệu dùng chung nhiều trang nằm ở `js/core/store.js`; CSS của trang nào nằm trong file của trang đó (`css/<trang>.css`), còn nút/ô nhập/hộp thoại... dùng lớp trong `css/components.css` và màu/khoảng cách lấy từ biến trong `css/tokens.css` (không viết màu cứng).

## Thêm một chức năng mới (ví dụ: "ghi chú")

Backend:

1. `constants/messages.py`: thêm thông báo lỗi mới (nếu có).
2. `repositories/note_repository.py`: câu SQL; nếu cần bảng/cột mới thì thêm vào `database/schema.py` (dùng `CREATE TABLE IF NOT EXISTS` hoặc nâng cấp cột như `_upgrade_words_schema`).
3. `services/note_service.py`: luật nghiệp vụ, `raise ValidationError/NotFoundError`.
4. `controllers/note_controller.py`: Blueprint mỏng, rồi thêm vào `BLUEPRINTS` trong `controllers/__init__.py`.

Frontend:

1. `js/api/notes-api.js`: các hàm gọi API.
2. `js/features/notes/index.js` (+ các file con nếu lớn) export `initNotes()`; thêm gọi `initNotes()` trong `main.js`.
3. `index.html`: thêm một nút vào `<nav class="sidebar-nav">` (`<button class="tab-btn" data-tab="tab-notes" title="Ghi chú" aria-label="Ghi chú">` với `<span class="nav-icon">` và `<span class="nav-label">`; icon thêm vào sprite `#icon-sprite` và tên trong `core/icons.js`) và `<section class="tab-panel hidden" id="tab-notes">` trong `<main>`; thêm id trang vào `TAB_IDS` và một dòng vào bảng `ROUTES` (địa chỉ `#notes` + tên hiển thị trên thanh trên cùng) trong `constants.js`.
4. `css/notes.css` và thẻ `<link>` tương ứng trong `index.html` (đặt trước `touch.css`).

Thêm một mục cài đặt mới: thêm khóa + hàm kiểm tra vào `_VALIDATORS` trong `services/settings_service.py`, hằng số mặc định vào `constants/review_settings.py` (hoặc file mới), và một file mới trong `js/features/settings/` (gọi trong `settings/index.js`) cùng một `<section class="settings-section">` trong `index.html`.

## Kiểm tra thủ công

Chưa có test tự động trong repo. Khi sửa code, chạy server với dữ liệu tạm (`ANKITOOL_DATA_DIR=<thư mục tạm>`) và đi qua các luồng: thêm/sửa/xóa từ, dán ảnh, đổi danh mục trong bảng từ, học bằng nút và vuốt, đổi cài đặt "Thời gian ôn lại", xuất `.apkg`.

## Nâng cấp frontend sau này

Cấu trúc `api/` + `features/` + `shared/` chuyển sang Vite gần như nguyên vẹn. Cân nhắc Vite khi muốn deploy frontend riêng hoặc dùng thư viện npm; cân nhắc React/Vue khi giao diện có nhiều trạng thái dùng chung giữa các trang hoặc nhiều thành phần lặp lại.
