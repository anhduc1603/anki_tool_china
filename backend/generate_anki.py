"""
Cong cu dong lenh: CSV -> .apkg.

    python backend/generate_anki.py words.csv output.apkg

Logic nam o ankitool/cli/csv_import.py.
"""

from ankitool.cli.csv_import import main

if __name__ == "__main__":
    main()
