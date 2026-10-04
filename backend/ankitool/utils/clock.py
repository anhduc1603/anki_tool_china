"""Thoi gian dia phuong dung cho lich on tap (due_at dang ISO: YYYY-MM-DD hoac YYYY-MM-DDTHH:MM:SS)."""

from datetime import date, datetime, timedelta


def today_iso():
    return date.today().isoformat()


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def due_after(seconds):
    """due_at dang YYYY-MM-DDTHH:MM:SS (gio dia phuong). Du lieu cu chi co
    YYYY-MM-DD van so sanh dung: 'ngay' < 'ngayTgio' nen coi nhu den han tu dau ngay."""
    return (datetime.now() + timedelta(seconds=seconds)).isoformat(timespec="seconds")
