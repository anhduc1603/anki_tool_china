// Prompt de nguoi dung dan sang AI ben ngoai (ChatGPT, Claude...) nham sinh dung CSV ma app doc duoc.
// Dinh dang cot phai khop voi backend: services/word_import_service.py (hanzi, pinyin, meaning, example, example_pinyin).

export const PROMPT_PLACEHOLDER = "[DÁN DANH SÁCH TỪ CỦA BẠN VÀO ĐÂY]";

const PROMPT_BODY = `Bạn là trợ lý tạo flashcard tiếng Trung cho người Việt học tiếng Trung.
Hãy chuyển danh sách từ ở cuối tin nhắn thành bảng CSV để nhập vào ứng dụng học từ vựng.

YÊU CẦU ĐỊNH DẠNG (rất quan trọng, ứng dụng sẽ đọc tự động):
- Chỉ trả về CSV UTF-8 trong MỘT khối code duy nhất. Không giải thích, không đánh số, không viết thêm chữ nào ngoài khối code.
- Dòng đầu tiên là tiêu đề đúng như sau: hanzi,pinyin,meaning,example,example_pinyin
- Mỗi từ một dòng, đúng 5 cột theo thứ tự trên, không thêm cột nào khác.
- hanzi: chữ Hán giản thể. Nếu tôi đưa pinyin hoặc nghĩa tiếng Việt thay vì chữ Hán, hãy chọn từ tiếng Trung phù hợp nhất.
- pinyin: có dấu thanh, các âm tiết cách nhau bằng dấu cách (ví dụ: nǐ hǎo).
- meaning: nghĩa tiếng Việt ngắn gọn; nếu có nhiều nghĩa thì ngăn cách bằng dấu chấm phẩy ";".
- example: MỘT câu ví dụ tiếng Trung kèm bản dịch tiếng Việt trong ngoặc, ví dụ: 我爱我的家人。(Tôi yêu gia đình của tôi.)
- example_pinyin: pinyin của phần tiếng Trung trong example (phần nằm NGOÀI ngoặc), theo đúng quy tắc sau:
  + Mỗi chữ Hán đúng MỘT âm tiết, theo thứ tự; các âm tiết cách nhau bằng đúng một dấu cách. Số âm tiết phải BẰNG số chữ Hán của câu ví dụ (không tính phần dịch trong ngoặc).
  + Không viết liền hai âm tiết: viết "lǎo shī", KHÔNG viết "lǎoshī".
  + Có dấu thanh (ā á ǎ à). Thanh nhẹ thì không đánh dấu (ví dụ: de, shi trong 认识).
  + Viết thanh gốc của từng chữ, không đổi theo biến điệu (你好 viết "nǐ hǎo", không viết "ní hǎo").
  + KHÔNG chép dấu câu (。，！？), không chữ số, không chữ Hán, không phần dịch tiếng Việt.
- QUY TẮC DẤU PHẨY (nguyên nhân lỗi nhập hay gặp nhất): ứng dụng tách cột bằng dấu phẩy ",". Vì vậy LUÔN đặt các cột meaning, example và example_pinyin trong dấu nháy kép "..." (kể cả khi trong đó không có dấu phẩy), và TRONG cột meaning KHÔNG dùng dấu phẩy ASCII ","; hãy thay bằng dấu chấm phẩy ";" (ví dụ chép "(đại từ chỉ người, ngôi thứ 2 số ít)" thành "(đại từ chỉ người; ngôi thứ 2 số ít)"). Dấu nháy kép bên trong một trường viết thành "". Dấu phẩy toàn chiều rộng "，" của tiếng Trung thì dùng bình thường.
- Không để trống hanzi, pinyin, meaning. Nếu không có câu ví dụ thì để trống cả example và example_pinyin. Nếu không chắc chắn về một từ, hãy điền theo cách hiểu phổ biến nhất.

VÍ DỤ ĐẦU RA:
\`\`\`csv
hanzi,pinyin,meaning,example,example_pinyin
你好,nǐ hǎo,"xin chào","你好，很高兴认识你。(Xin chào, rất vui được gặp bạn.)","nǐ hǎo hěn gāo xìng rèn shi nǐ"
爱,ài,"yêu; tình yêu","我爱我的家人。(Tôi yêu gia đình của tôi.)","wǒ ài wǒ de jiā rén"
她,tā,"cô ấy; chị ấy","她是我的老师。(Cô ấy là giáo viên của tôi.)","tā shì wǒ de lǎo shī"
\`\`\`

DANH SÁCH TỪ CỦA TÔI:
`;

// Prompt cho ẢNH CHỤP SÁCH: AI đọc ảnh các trang của một bài, chọn từ nên học và trả đúng CSV (cùng định dạng/quy tắc
// pinyin như PROMPT_BODY) kèm khối ghi chú riêng. Ba dòng "TÙY CHỌN" do người dùng sửa chữ trong khung chat của AI.
export const BOOK_PROMPT = `Bạn là trợ lý tạo flashcard tiếng Trung cho người Việt học giáo trình. Tôi gửi kèm ẢNH CHỤP CÁC TRANG của một bài học (giáo trình Hán ngữ Boya hoặc tương tự). Hãy đọc (OCR) các trang, chọn những từ nên học, rồi trả về bảng CSV để nhập vào ứng dụng học từ vựng.

TÙY CHỌN (tôi có thể sửa trước khi gửi):
- Tên riêng (人名/地名 trong mục "Tên riêng"): KHÔNG lấy
- Từ ngoài bảng "Từ mới" nhưng quan trọng (trong hội thoại, ngữ pháp): tối đa 5 từ
- Ghi âm Hán Việt vào cuối nghĩa: CÓ

CÁCH CHỌN TỪ (theo thứ tự ưu tiên):
1. LẤY TẤT CẢ các mục trong bảng từ vựng của bài (thường có tiêu đề "词语表" / "Từ mới", gồm số thứ tự, chữ Hán, pinyin, từ loại, âm Hán Việt, nghĩa tiếng Việt). Giữ đúng thứ tự trong sách. Một mục có nhiều từ loại thì vẫn là MỘT dòng.
2. Mục "Tên riêng / 专有名词": theo tùy chọn ở trên (mặc định bỏ qua).
3. Từ ngoài bảng: chỉ thêm tối đa số lượng đã cho, và chỉ khi từ đó (a) xuất hiện trong hội thoại/ví dụ ngữ pháp của bài, (b) hữu ích cho người mới học (thường gặp, thuộc mẫu câu trọng điểm), (c) chưa có trong bảng từ mới. Nghĩa và pinyin của chúng do bạn cung cấp.
4. KHÔNG lấy: số trang, tiêu đề, chữ in chìm/logo/hình mờ (ví dụ tên website), từ trong ô tiếng Anh/tiếng Việt thuần, dấu câu, ký hiệu ngữ pháp (S, n., ①②).

CÁCH ĐỌC ẢNH:
- Có thể có nhiều ảnh: gộp tất cả, bỏ từ trùng.
- Ảnh có thể nghiêng, mờ hoặc có hình mờ chồng lên chữ: cố đọc đúng. Chữ Hán/pinyin in rõ trong sách thì ưu tiên chép đúng như sách. Đừng bịa khi không đọc được; ghi vào phần GHI CHÚ.
- Dùng chữ Hán GIẢN THỂ như trong sách.

ĐỊNH DẠNG CSV (ứng dụng đọc tự động, rất quan trọng):
- Dòng đầu là tiêu đề đúng như sau: hanzi,pinyin,meaning,example,example_pinyin
- Mỗi từ một dòng, đúng 5 cột, không thêm cột khác.
- hanzi: chữ Hán của từ (đúng như bảng từ mới).
- pinyin: có dấu thanh, TÁCH từng âm tiết bằng dấu cách (sách viết "xuésheng" thì ghi "xué sheng"; "lǎoshī" ghi "lǎo shī"). Thanh nhẹ không đánh dấu. Chép thanh như sách in (bú kè qi, không tự đổi).
- meaning: nghĩa tiếng Việt ngắn gọn theo sách; nhiều nghĩa thì ngăn bằng dấu chấm phẩy ";". Nếu bật tùy chọn Hán Việt, thêm vào CUỐI: " (Hán Việt: ...)". Thông tin từ loại hoặc chú thích ngắn của sách đặt trong ngoặc sau nghĩa chính.
- example: MỘT câu ví dụ tiếng Trung kèm bản dịch tiếng Việt trong ngoặc, ví dụ: 我是学生。(Tôi là học sinh.) Ưu tiên chép NGUYÊN VĂN một câu trong hội thoại/ví dụ ngữ pháp của bài có chứa từ đó (kèm dịch của bạn). Không có câu phù hợp trong bài thì tự đặt một câu ngắn, đơn giản. Nếu không thể, để trống example và example_pinyin.
- example_pinyin: pinyin của phần tiếng Trung NẰM NGOÀI ngoặc của example. Quy tắc:
  + Mỗi chữ Hán đúng MỘT âm tiết, các âm tiết cách nhau đúng một dấu cách. Số âm tiết BẰNG số chữ Hán (không tính phần dịch trong ngoặc).
  + Viết thanh gốc của từng chữ, không đổi theo biến điệu (不是 viết "bù shì", 你好 viết "nǐ hǎo").
  + KHÔNG chép dấu câu (。，！？), không chữ số, không chữ Hán, không phần dịch.
- QUY TẮC DẤU PHẨY (nguyên nhân lỗi nhập hay gặp nhất): ứng dụng tách cột bằng dấu phẩy ",". Vì vậy LUÔN đặt các cột meaning, example và example_pinyin trong dấu nháy kép "..." (kể cả khi trong đó không có dấu phẩy), và TRONG cột meaning KHÔNG dùng dấu phẩy ASCII ","; hãy thay bằng dấu chấm phẩy ";" (ví dụ chép "(đại từ chỉ người, ngôi thứ 2 số ít)" thành "(đại từ chỉ người; ngôi thứ 2 số ít)"). Dấu nháy kép bên trong một trường viết thành "". Dấu phẩy toàn chiều rộng "，" của tiếng Trung thì dùng bình thường.
- Không để trống hanzi, pinyin, meaning.

ĐẦU RA (đúng hai khối, theo thứ tự, không viết thêm gì khác):
Khối 1: CSV trong MỘT khối code \`\`\`csv ... \`\`\`
Khối 2: ghi chú trong khối code \`\`\`text ... \`\`\`, gồm: (a) các từ đọc chưa chắc chắn (số thứ tự trong sách + lý do), (b) các từ ngoài bảng bạn đã thêm, (c) các mục bạn cố ý bỏ qua (nếu có).

VÍ DỤ KHỐI 1:
\`\`\`csv
hanzi,pinyin,meaning,example,example_pinyin
你好,nǐ hǎo,"chào bạn (Hán Việt: nhĩ hảo)","你好！(Chào bạn!)","nǐ hǎo"
老师,lǎo shī,"giáo viên; thầy giáo; cô giáo (Hán Việt: lão sư)","她是老师。(Cô ấy là giáo viên.)","tā shì lǎo shī"
不客气,bú kè qi,"đừng khách sáo (Hán Việt: bất khách khí)","不客气。(Không có gì.)","bù kè qi"
你,nǐ,"bạn; anh; chị (đại từ chỉ người; ngôi thứ 2 số ít) (Hán Việt: nhĩ)","你是老师吗？(Bạn là giáo viên phải không?)","nǐ shì lǎo shī ma"
\`\`\`

BẮT ĐẦU: hãy đọc các ảnh tôi đính kèm và trả về hai khối như trên.
`;

// wordList: văn bản người dùng nhập (mỗi dòng một từ); trống thì chèn dòng nhắc dán danh sách
export function buildPrompt(wordList) {
  const list = (wordList || "").trim();
  return PROMPT_BODY + (list || PROMPT_PLACEHOLDER) + "\n";
}

// Sao chép: Clipboard API -> dự phòng execCommand trên ô prompt -> báo sao chép thủ công.
// Trả về "ok" hoặc "manual".
export async function copyPrompt(text, fallbackTextarea) {
  try {
    await navigator.clipboard.writeText(text);
    return "ok";
  } catch (err) {
    /* thử cách dự phòng */
  }
  try {
    if (fallbackTextarea) {
      fallbackTextarea.closest("details")?.setAttribute("open", "");
      fallbackTextarea.focus();
      fallbackTextarea.select();
      if (document.execCommand("copy")) return "ok";
    }
  } catch (err) {
    /* rơi xuống thủ công */
  }
  return "manual";
}
