FROM python:3.11-slim

# tzdata: app luu gio on tap theo gio dia phuong cua container (xem TZ trong docker-compose.yml)
RUN apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY backend ./backend
COPY frontend ./frontend

# Du lieu (SQLite + media) nam ngoai image, gan vao qua volume
ENV ANKITOOL_DATA_DIR=/data
EXPOSE 8000

# 1 tien trinh nhieu luong: dung SQLite, 1 nguoi dung
CMD ["gunicorn", "--chdir", "backend", "-b", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--timeout", "120", "ankitool:create_app()"]
