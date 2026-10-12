// Pinyin cua tu va cau vi du: thanh dieu, ghep chu Han voi am tiet, dung HTML co mau.
// Quy tac phai giong backend/ankitool/utils/pinyin.py (kiem thu chung 1 bo vi du).
// Khong dung DOM de co the chay duoc bang node.

const OPEN = "(（";
const CLOSE = ")）";
const TONE_MARKS = { "̄": 1, "́": 2, "̌": 3, "̀": 4 };
const NEUTRAL_TONE = 5;

export function escapeText(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isCjk(ch) {
  return (ch >= "㐀" && ch <= "䶿") || (ch >= "一" && ch <= "鿿");
}

// 1..4 theo dau thanh; khong co dau -> thanh nhe (5)
export function toneOf(syllable) {
  for (const ch of syllable.normalize("NFD")) {
    if (ch in TONE_MARKS) return TONE_MARKS[ch];
  }
  return NEUTRAL_TONE;
}

function validSyllable(token) {
  for (const ch of token) {
    if (ch === "'" || ch === "’") continue;
    if (!/\p{L}/u.test(ch) || isCjk(ch)) return false;
  }
  return true;
}

// Chuoi pinyin -> danh sach am tiet (NFC, tach theo khoang trang); co ky tu khong hop le -> null
export function splitSyllables(text) {
  const tokens = (text || "").normalize("NFC").split(/\s+/).filter(Boolean);
  return tokens.every(validSyllable) ? tokens : null;
}

// Cac chu Han can chu am (ngoai ngoac) -> vi tri trong chuoi (theo chi so UTF-16 nhu moi ky tu CJK BMP)
export function annotatableIndexes(example) {
  let depth = 0;
  const indexes = [];
  const chars = Array.from(example || "");
  chars.forEach((ch, i) => {
    if (OPEN.includes(ch)) depth += 1;
    else if (CLOSE.includes(ch)) depth = Math.max(0, depth - 1);
    else if (depth === 0 && isCjk(ch)) indexes.push(i);
  });
  return indexes;
}

// Van ban tieng Trung de doc to (ngoai ngoac, gop khoang trang); "" neu khong co chu Han ngoai ngoac.
// Phai giong spoken_text() o backend: audio trong app va trong Anki dung chung file cache theo van ban.
export function spokenText(example) {
  let depth = 0;
  let kept = "";
  let hasCjk = false;
  for (const ch of Array.from(example || "")) {
    if (OPEN.includes(ch)) depth += 1;
    else if (CLOSE.includes(ch)) depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      kept += ch;
      hasCjk = hasCjk || isCjk(ch);
    }
  }
  return hasCjk ? kept.split(/\s+/).filter(Boolean).join(" ") : "";
}

// Ghep chu Han voi am tiet -> [{text, syllable|null}] hoac null neu so luong khong khop
export function alignExample(example, syllables) {
  const chars = Array.from(example || "");
  const indexes = annotatableIndexes(example);
  if (indexes.length !== syllables.length) return null;
  const bySlot = new Map(indexes.map((slot, k) => [slot, syllables[k]]));
  const segments = [];
  let plain = "";
  chars.forEach((ch, i) => {
    if (bySlot.has(i)) {
      if (plain) segments.push({ text: plain, syllable: null });
      plain = "";
      segments.push({ text: ch, syllable: bySlot.get(i) });
    } else {
      plain += ch;
    }
  });
  if (plain) segments.push({ text: plain, syllable: null });
  return segments;
}

// Pinyin cua tu chinh: moi am tiet 1 mau theo thanh (HTML da escape)
export function renderWordPinyin(pinyin) {
  const tokens = (pinyin || "").normalize("NFC").split(/\s+/).filter(Boolean);
  return tokens.map((s) => `<span class="tone-${toneOf(s)}">${escapeText(s)}</span>`).join(" ");
}

// Cau vi du dang ruby (pinyin tren moi chu Han, cung mau thanh). Tra ve null neu khong co pinyin hoac
// pinyin khong khop chu Han: noi goi hien van ban thuong nhu cu.
export function renderExample(example, examplePinyin) {
  const syllables = splitSyllables(examplePinyin);
  if (!syllables || syllables.length === 0) return null;
  const segments = alignExample(example, syllables);
  if (!segments) return null;
  return segments
    .map((seg) =>
      seg.syllable
        ? `<ruby class="tone-${toneOf(seg.syllable)}">${escapeText(seg.text)}<rt>${escapeText(seg.syllable)}</rt></ruby>`
        : escapeText(seg.text)
    )
    .join("");
}
