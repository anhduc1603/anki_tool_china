// Gửi các dòng hợp lệ lên server theo từng lô nhỏ; có tiến trình và hủy giữa các lô.
// Không dùng DOM: index.js lo giao diện.

import { importWords } from "../../../api/words-api.js";
import { IMPORT_BATCH_SIZE } from "../../../constants.js";

// rows: các dòng hợp lệ từ xem trước ({row, hanzi, pinyin, meaning, example}).
// onProgress(processed, total); isCancelled(): kiểm tra trước mỗi lô.
// Trả về { results: [{row, status, reason?, id?}], notProcessed: [row...], cancelled, error }
export async function runImport(rows, { onProgress, isCancelled }) {
  const results = [];
  let processed = 0;
  let cancelled = false;
  let error = null;
  onProgress(0, rows.length);

  for (let start = 0; start < rows.length; start += IMPORT_BATCH_SIZE) {
    if (isCancelled()) {
      cancelled = true;
      break;
    }
    const batch = rows.slice(start, start + IMPORT_BATCH_SIZE);
    const payload = batch.map(({ row, hanzi, pinyin, meaning, example }) => ({
      row,
      hanzi,
      pinyin,
      meaning,
      example,
    }));
    try {
      const { ok, data } = await importWords(payload);
      if (!ok) {
        error = data.error || "Server từ chối yêu cầu nhập.";
        break;
      }
      results.push(...data.results);
      processed += batch.length;
      onProgress(processed, rows.length);
    } catch (err) {
      error = "Mất kết nối tới server: " + err.message;
      break;
    }
  }

  const done = new Set(results.map((r) => r.row));
  const notProcessed = rows.filter((r) => !done.has(r.row)).map((r) => r.row);
  return { results, notProcessed, cancelled, error };
}
