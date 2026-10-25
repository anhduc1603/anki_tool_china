"""Sinh icon cua app (frontend/img/): chu "汉" mau trang tren nen chang.

Chi chay khi muon doi icon; icon da sinh nam san trong frontend/img nen khong can chay khi trien khai.
Can Pillow (khong co trong requirements.txt) va 1 font co chu Han (mac dinh: Microsoft YaHei tren Windows).
Chay: python backend/make_app_icons.py [duong-dan-font]
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

PRIMARY = (67, 56, 202)  # trung --primary trong frontend/css/tokens.css
WHITE = (255, 255, 255)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "img")
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyhbd.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]


def find_font():
    for path in sys.argv[1:] + FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    sys.exit("Khong tim thay font co chu Han; truyen duong dan font lam doi so.")


def render(size, glyph_ratio, rounded, font_path):
    # Ve lon gap 4 lan roi thu nho de nhan muot
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if rounded:
        draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.22), fill=PRIMARY)
    else:
        draw.rectangle((0, 0, s, s), fill=PRIMARY)  # maskable: nen phu kin, he dieu hanh tu cat
    font = ImageFont.truetype(font_path, int(s * glyph_ratio))
    box = draw.textbbox((0, 0), "汉", font=font)
    x = (s - (box[2] - box[0])) / 2 - box[0]
    y = (s - (box[3] - box[1])) / 2 - box[1]
    draw.text((x, y), "汉", font=font, fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


def main():
    font_path = find_font()
    os.makedirs(OUT, exist_ok=True)
    targets = [
        ("icon-192.png", 192, 0.62, True),
        ("icon-512.png", 512, 0.62, True),
        ("icon-maskable-512.png", 512, 0.5, False),  # chu nam trong vung an toan 80% o giua
        ("apple-touch-icon.png", 180, 0.55, False),  # iOS tu bo goc
    ]
    for name, size, ratio, rounded in targets:
        render(size, ratio, rounded, font_path).save(os.path.join(OUT, name))
        print("da tao", name)


if __name__ == "__main__":
    main()
