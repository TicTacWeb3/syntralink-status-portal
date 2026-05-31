FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DATABASE_PATH=/data/syntralink.db

WORKDIR /app

COPY index.html customer.html app.js customer.js styles.css README.md DEMO_PROMPT.md MESSAGGIO_REDDIT.md server.py ./

RUN mkdir -p /data

EXPOSE 8080

CMD ["python", "server.py"]
