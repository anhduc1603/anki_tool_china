"""
Don cac file trong data/media khong con tu nao dung (anh goi nho, GIF, audio mo coi).

    python backend/cleanup_media.py                  # chi LIET KE, khong xoa gi
    python backend/cleanup_media.py --apply          # xoa that su
    python backend/cleanup_media.py --apply --min-age-minutes 0

Dung thu muc du lieu giong app (mac dinh data/, doi bang bien moi truong ANKITOOL_DATA_DIR).
Nen sao luu data/ truoc khi --apply: file da xoa khong khoi phuc duoc.
"""

import argparse
import os
import sys
import time
from collections import defaultdict

from ankitool.config.settings import AppConfig, set_config
from ankitool.repositories import word_repository

DEFAULT_MIN_AGE_MINUTES = 10  # file moi hon ngung nay duoc giu lai (co the la anh vua tai len)
SAMPLE_LIMIT = 5

EXIT_OK = 0
EXIT_PARTIAL = 1  # co file khong xoa duoc
EXIT_NO_DATABASE = 2
EXIT_REFUSED = 3  # tu choi xoa vi database khong co tu nao


def _format_size(size):
    value = float(size)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            return f"{value:.0f} {unit}" if unit == "B" else f"{value:.1f} {unit}"
        value /= 1024


def find_unused_files(media_dir, referenced, min_age_seconds, now=None):
    """Tra ve (file_mo_coi_du_tuoi, file_mo_coi_moi): moi phan tu la (ten, dung_luong).
    Chi xet file thuong nam truc tiep trong media_dir (bo thu muc con, file bat dau bang '.')."""
    now = time.time() if now is None else now
    old, recent = [], []
    with os.scandir(media_dir) as entries:
        for entry in sorted(entries, key=lambda e: e.name):
            if entry.name.startswith(".") or entry.name in referenced:
                continue
            if not entry.is_file(follow_symlinks=False):
                continue
            stat = entry.stat(follow_symlinks=False)
            target = old if now - stat.st_mtime >= min_age_seconds else recent
            target.append((entry.name, stat.st_size))
    return old, recent


def _print_groups(files):
    groups = defaultdict(lambda: [0, 0])
    for name, size in files:
        ext = os.path.splitext(name)[1].lower() or "(không đuôi)"
        groups[ext][0] += 1
        groups[ext][1] += size
    for ext in sorted(groups):
        count, size = groups[ext]
        print(f"  {ext:<12} {count:>4} file   {_format_size(size):>10}")
    print(f"  {'Tổng':<12} {len(files):>4} file   {_format_size(sum(s for _, s in files)):>10}")


def main(argv=None):
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Dọn file media không còn từ nào dùng (mặc định chỉ liệt kê).")
    parser.add_argument("--apply", action="store_true", help="xóa thật sự các file không dùng")
    parser.add_argument(
        "--min-age-minutes",
        type=float,
        default=DEFAULT_MIN_AGE_MINUTES,
        help=f"bỏ qua file mới hơn số phút này (mặc định {DEFAULT_MIN_AGE_MINUTES})",
    )
    parser.add_argument(
        "--allow-empty-db",
        action="store_true",
        help="cho phép xóa dù database không có từ nào (mặc định từ chối để tránh trỏ nhầm thư mục dữ liệu)",
    )
    args = parser.parse_args(argv)

    config = set_config(AppConfig.from_env())
    if not os.path.isfile(config.db_file):
        print(f"Không tìm thấy database: {config.db_file}")
        return EXIT_NO_DATABASE
    if not os.path.isdir(config.media_dir):
        print(f"Chưa có thư mục media ({config.media_dir}), không có gì để dọn.")
        return EXIT_OK

    word_count = len(word_repository.list_all())
    referenced = word_repository.list_referenced_media()
    old, recent = find_unused_files(config.media_dir, referenced, args.min_age_minutes * 60)

    print(f"Thư mục media: {config.media_dir}")
    print(f"Database: {word_count} từ, {len(referenced)} file đang được dùng.")
    if recent:
        print(f"Bỏ qua {len(recent)} file không dùng nhưng mới tạo gần đây (dưới {args.min_age_minutes:g} phút).")

    if not old:
        print("Không có file nào cần dọn.")
        return EXIT_OK

    print(f"\nFile không từ nào dùng ({'sẽ xóa' if args.apply else 'chỉ liệt kê'}):")
    _print_groups(old)
    print("Ví dụ: " + ", ".join(name for name, _ in old[:SAMPLE_LIMIT]) + (" ..." if len(old) > SAMPLE_LIMIT else ""))

    if not args.apply:
        print("\nChưa xóa gì. Sao lưu data/ rồi chạy lại với --apply để xóa các file trên.")
        return EXIT_OK

    if word_count == 0 and not args.allow_empty_db:
        print(
            "\nTừ chối xóa: database không có từ nào nhưng thư mục media lại có file. "
            "Có thể bạn đang trỏ nhầm thư mục dữ liệu. Nếu chắc chắn, thêm --allow-empty-db."
        )
        return EXIT_REFUSED

    removed_size = failed = removed = 0
    for name, size in old:
        try:
            os.remove(os.path.join(config.media_dir, name))
            removed += 1
            removed_size += size
        except OSError as e:
            failed += 1
            print(f"  Không xóa được {name}: {e}")
    print(f"\nĐã xóa {removed} file, giải phóng {_format_size(removed_size)}." + (f" {failed} file lỗi." if failed else ""))
    return EXIT_PARTIAL if failed else EXIT_OK
