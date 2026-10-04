"""
Chay web app local (Flask dev server):

    python backend/run.py            # http://127.0.0.1:5000
    python backend/run.py --port 5001 --no-debug
"""

import argparse
import sys

from ankitool import create_app
from ankitool.config.settings import DEFAULT_HOST, DEFAULT_PORT

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="AnkiTool web app")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--no-debug", action="store_true", help="tat debug/reloader")
    args = parser.parse_args()
    create_app().run(host=args.host, port=args.port, debug=not args.no_debug)


if __name__ == "__main__":
    main()
