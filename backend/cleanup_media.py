"""
Công cụ dòng lệnh: dọn file trong data/media không còn từ nào dùng.

    python backend/cleanup_media.py            # chỉ liệt kê
    python backend/cleanup_media.py --apply    # xóa thật sự

Logic nằm ở ankitool/cli/cleanup_media.py.
"""

import sys

from ankitool.cli.cleanup_media import main

if __name__ == "__main__":
    sys.exit(main())
