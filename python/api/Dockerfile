FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
 && useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin matching
COPY . .
ARG PORT=8000
ENV PORT=${PORT}
EXPOSE ${PORT}
# Sin privilegios de root (DEF-13): el código queda de solo lectura para este usuario.
USER matching
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
