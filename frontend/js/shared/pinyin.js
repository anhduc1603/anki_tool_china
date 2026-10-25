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

// ---- So sanh pinyin go vao voi pinyin dung (tab Hoc, che do go dap an) ----

const TONE_MARK_RE = /[̀́̄̌]/g;

// Khoa so sanh cua 1 ky tu: chu cai thuong khong dau thanh (u+dau cham doi = "v", nhu go "v" cho ü);
// "" neu khong phai chu cai (khoang trang, dau cau...).
function letterKey(ch) {
  const base = ch
    .normalize("NFD")
    .replace(TONE_MARK_RE, "")
    .replace(/ü/gi, "v")
    .replace(/ɡ/g, "g") // g 1 tang trong pinyin in
    .toLowerCase();
  return /^[a-z]$/.test(base) ? base : "";
}

// So khop theo ky tu (day con chung dai nhat), bo qua dau thanh, hoa/thuong, khoang trang, v == ü.
// Tra ve { full, typed: [{ch, state}], expected: [{ch, state}] } voi state: "good" | "bad" (chi o typed)
// | "missed" (chi o expected) | "neutral" (ky tu khong phai chu cai).
export function comparePinyin(typed, expected) {
  const a = Array.from((typed || "").normalize("NFC")).map((ch) => ({ ch, key: letterKey(ch) }));
  const b = Array.from((expected || "").normalize("NFC")).map((ch) => ({ ch, key: letterKey(ch) }));
  const ai = a.map((e, i) => (e.key ? i : -1)).filter((i) => i >= 0);
  const bi = b.map((e, i) => (e.key ? i : -1)).filter((i) => i >= 0);

  // dp[i][j] = do dai LCS cua ai[i..] va bi[j..]
  const dp = Array.from({ length: ai.length + 1 }, () => new Array(bi.length + 1).fill(0));
  for (let i = ai.length - 1; i >= 0; i--) {
    for (let j = bi.length - 1; j >= 0; j--) {
      dp[i][j] = a[ai[i]].key === b[bi[j]].key ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matchedA = new Set();
  const matchedB = new Set();
  let i = 0;
  let j = 0;
  while (i < ai.length && j < bi.length) {
    if (a[ai[i]].key === b[bi[j]].key && dp[i][j] === dp[i + 1][j + 1] + 1) {
      matchedA.add(ai[i]);
      matchedB.add(bi[j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  const full = ai.length > 0 && ai.length === bi.length && matchedA.size === ai.length;
  return {
    full,
    typed: a.map((e, idx) => ({ ch: e.ch, state: !e.key ? "neutral" : matchedA.has(idx) ? "good" : "bad" })),
    expected: b.map((e, idx) => ({ ch: e.ch, state: !e.key ? "neutral" : matchedB.has(idx) ? "good" : "missed" })),
  };
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
