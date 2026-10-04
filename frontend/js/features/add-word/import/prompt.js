// Prompt de nguoi dung dan sang AI ben ngoai (ChatGPT, Claude...) nham sinh dung CSV ma app doc duoc.
// Dinh dang cot phai khop voi backend: services/word_import_service.py (hanzi, pinyin, meaning, example).

export const PROMPT_PLACEHOLDER = "[DÁN DANH SÁCH TỪ CỦA BẠN VÀO ĐÂY]";

const PROMPT_BODY = `Bạn là trợ lý tạo flashcard tiếng Trung cho người Việt học tiếng Trung.
Hãy chuyển danh sách từ ở cuối tin nhắn thành bảng CSV để nhập vào ứng dụng học từ vựng.

YÊU CẦU ĐỊNH DẠNG (rất quan trọng, ứng dụng sẽ đọc tự động):
- Chỉ trả về CSV UTF-8 trong MỘT khối code duy nhất. Không giải thích, không đánh số, không viết thêm chữ nào ngoài khối code.
- Dòng đầu tiên là tiêu đề đúng như sau: hanzi,pinyin,meaning,example
- Mỗi từ một dòng, đúng 4 cột theo thứ tự trên, không thêm cột nào khác.
- hanzi: chữ Hán giản thể. Nếu tôi đưa pinyin hoặc nghĩa tiếng Việt thay vì chữ Hán, hãy chọn từ tiếng Trung phù hợp nhất.
- pinyin: có dấu thanh, các âm tiết cách nhau bằng dấu cách (ví dụ: nǐ hǎo).
- meaning: nghĩa tiếng Việt ngắn gọn; nếu có nhiều nghĩa thì ngăn cách bằng dấu chấm phẩy ";".
- example: MỘT câu ví dụ tiếng Trung kèm bản dịch tiếng Việt trong ngoặc, ví dụ: 我爱我的家人。(Tôi yêu gia đình của tôi.)
- Mọi trường có chứa dấu phẩy, dấu nháy kép hoặc xuống dòng phải đặt trong dấu nháy kép "..."; dấu nháy kép bên trong viết thành "".
- Không để trống hanzi, pinyin, meaning. Nếu không chắc chắn về một từ, hãy điền theo cách hiểu phổ biến nhất.

VÍ DỤ ĐẦU RA:
\`\`\`csv
hanzi,pinyin,meaning,example
你好,nǐ hǎo,xin chào,"你好，很高兴认识你。(Xin chào, rất vui được gặp bạn.)"
爱,ài,"yêu; tình yêu","我爱我的家人。(Tôi yêu gia đình của tôi.)"
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
