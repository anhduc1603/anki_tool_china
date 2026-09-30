"""
Sinh file .apkg de import vao Anki tu file CSV cac tu tieng Trung.
(Cong cu dong lenh - phien ban co giao dien web xem trong app.py)

Cach dung:
    python generate_anki.py words.csv output.apkg

File CSV can co cac cot (co header dong dau):
    hanzi,pinyin,meaning,example,gif

    - hanzi   : chu Han (bat buoc)
    - pinyin  : pinyin co dau thanh (bat buoc)
    - meaning : nghia tieng Viet (bat buoc)
    - example : cau vi du (co the de trong)
    - gif     : duong dan toi file gif/anh minh hoa net viet (co the de trong)

Audio phat am se duoc TU DONG sinh bang edge-tts (khong can nhap tay).
Neu cau vi du/nghia co dau phay, phai bo trong dau ngoac kep "..." theo chuan CSV.
"""

import csv
import os
import sys

import anki_builder

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

MEDIA_DIR = "_media_cache"


def read_words(csv_path):
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = [row for row in reader if row.get("hanzi", "").strip()]
    return rows


def main():
    if len(sys.argv) != 3:
        print("Cach dung: python generate_anki.py <input.csv> <output.apkg>")
        sys.exit(1)

    csv_path, output_path = sys.argv[1], sys.argv[2]
    deck_name = os.path.splitext(os.path.basename(output_path))[0]

    rows = read_words(csv_path)
    if not rows:
        print("Khong co tu nao trong file CSV.")
        sys.exit(1)

    print(f"Doc duoc {len(rows)} tu tu {csv_path}")

    words = []
    for row in rows:
        gif_path = row.get("gif", "").strip()
        if gif_path and not os.path.exists(gif_path):
            print(f"  [!] Khong tim thay file gif: {gif_path} (bo qua)")
            gif_path = ""
        words.append(
            {
                "hanzi": row.get("hanzi", ""),
                "pinyin": row.get("pinyin", ""),
                "meaning": row.get("meaning", ""),
                "example": row.get("example", ""),
                "gif_path": gif_path or None,
            }
        )

    print("Dang sinh audio va dong goi file...")
    anki_builder.build_apkg(words, MEDIA_DIR, output_path, deck_name)

    print(f"\nDa tao xong file: {output_path}")
    print("Mo Anki -> File -> Import... -> chon file nay de nhap the.")


if __name__ == "__main__":
    main()
