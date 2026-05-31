FROM python:3.12-slim

LABEL org.opencontainers.image.source="https://github.com/TicTacWeb3/syntralink-status-portal" \
      org.opencontainers.image.description="Multi-person hourly calendar SyntraNet demo"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY index.html app.js styles.css README.md DEMO_PROMPT.md MESSAGGIO_REDDIT.md server.py ./

RUN mkdir -p /data

EXPOSE 3000

CMD ["python", "server.py"]
