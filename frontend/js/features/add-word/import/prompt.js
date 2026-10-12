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
- Mọi trường có chứa dấu phẩy, dấu nháy kép hoặc xuống dòng phải đặt trong dấu nháy kép "..."; dấu nháy kép bên trong viết thành "".
- Không để trống hanzi, pinyin, meaning. Nếu không có câu ví dụ thì để trống cả example và example_pinyin. Nếu không chắc chắn về một từ, hãy điền theo cách hiểu phổ biến nhất.

VÍ DỤ ĐẦU RA:
\`\`\`csv
hanzi,pinyin,meaning,example,example_pinyin
你好,nǐ hǎo,xin chào,"你好，很高兴认识你。(Xin chào, rất vui được gặp bạn.)",nǐ hǎo hěn gāo xìng rèn shi nǐ
爱,ài,"yêu; tình yêu","我爱我的家人。(Tôi yêu gia đình của tôi.)",wǒ ài wǒ de jiā rén
她,tā,"cô ấy; chị ấy","她是我的老师。(Cô ấy là giáo viên của tôi.)",tā shì wǒ de lǎo shī
\`\`\`

DANH SÁCH TỪ CỦA TÔI:
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
