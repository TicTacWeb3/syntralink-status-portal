FROM python:3.12-slim

LABEL org.opencontainers.image.source="https://github.com/TicTacWeb3/syntralink-status-portal" \
      org.opencontainers.image.description="SyntraLink customer work-status portal with a minimal SQLite backend"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000 \
    FALLBACK_PORTS=8080,80 \
    DATABASE_PATH=/data/syntralink.db

WORKDIR /app

COPY index.html customer.html app.js customer.js styles.css README.md DEMO_PROMPT.md MESSAGGIO_REDDIT.md server.py ./

RUN mkdir -p /data

EXPOSE 3000 8080 80

CMD ["python", "server.py"]
