#!/usr/bin/env python3
import json
import os
import sqlite3
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


APP_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DATABASE_PATH", APP_DIR / "data" / "syntralink.db"))
PORT = int(os.environ.get("PORT", "8080"))
FALLBACK_PORT = int(os.environ.get("FALLBACK_PORT", "0"))

DEMO_JOBS = [
    {
        "id": "MR-204",
        "client": "Marco Rossi",
        "email": "marco.rossi@email.it",
        "work": "Boiler repair",
        "status": "Needs update",
        "currentStep": "Replacement part ordered",
        "nextUpdate": "Today by 5:30 PM",
        "publicNote": "The replacement part has been ordered. As soon as it arrives, the technician will complete installation and testing.",
        "views": 8,
        "steps": ["Request received", "Diagnosis complete", "Replacement part ordered", "Installation and testing", "Closure with photos"],
    },
    {
        "id": "LB-118",
        "client": "Laura Bianchi",
        "email": "laura.bianchi@email.it",
        "work": "Bathroom renovation",
        "status": "In progress",
        "currentStep": "Final photo missing",
        "nextUpdate": "Today by 6:00 PM",
        "publicNote": "The main work is complete. Only the final quality check and photo proof are still pending.",
        "views": 3,
        "steps": ["Site inspection", "Work in progress", "Area cleanup", "Final photo", "Handover"],
    },
    {
        "id": "SV-077",
        "client": "Studio Verde",
        "email": "admin@studioverde.it",
        "work": "System maintenance",
        "status": "Ready",
        "currentStep": "Ready for delivery",
        "nextUpdate": "Now",
        "publicNote": "The service is complete. The portal includes the summary and pickup instructions.",
        "views": 11,
        "steps": ["Received", "Technician assigned", "Service completed", "Ready for delivery"],
    },
    {
        "id": "ON-442",
        "client": "Officina Nord",
        "email": "office@officinanord.it",
        "work": "Urgent estimate",
        "status": "Waiting on customer",
        "currentStep": "Variant approval",
        "nextUpdate": "Tomorrow at 9:00 AM",
        "publicNote": "The variant needs customer approval before work can continue.",
        "views": 5,
        "steps": ["Request received", "Estimate sent", "Waiting for approval", "Execution"],
    },
]


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with connect() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                client TEXT NOT NULL,
                email TEXT NOT NULL,
                work TEXT NOT NULL,
                status TEXT NOT NULL,
                current_step TEXT NOT NULL,
                next_update TEXT NOT NULL,
                public_note TEXT NOT NULL,
                views INTEGER NOT NULL DEFAULT 0,
                steps_json TEXT NOT NULL
            )
            """
        )
        count = db.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        if count == 0:
            replace_jobs(DEMO_JOBS, db)


def row_to_job(row):
    return {
        "id": row["id"],
        "client": row["client"],
        "email": row["email"],
        "work": row["work"],
        "status": row["status"],
        "currentStep": row["current_step"],
        "nextUpdate": row["next_update"],
        "publicNote": row["public_note"],
        "views": row["views"],
        "steps": json.loads(row["steps_json"]),
    }


def list_jobs():
    with connect() as db:
        rows = db.execute("SELECT * FROM jobs ORDER BY rowid").fetchall()
        return [row_to_job(row) for row in rows]


def replace_jobs(jobs, db=None):
    owns_connection = db is None
    db = db or connect()
    try:
        db.execute("DELETE FROM jobs")
        for job in jobs:
            db.execute(
                """
                INSERT INTO jobs (
                    id, client, email, work, status, current_step,
                    next_update, public_note, views, steps_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(job.get("id") or ""),
                    str(job.get("client") or ""),
                    str(job.get("email") or "").lower(),
                    str(job.get("work") or ""),
                    str(job.get("status") or "Needs update"),
                    str(job.get("currentStep") or "Request received"),
                    str(job.get("nextUpdate") or "Within 24 hours"),
                    str(job.get("publicNote") or "Update being prepared."),
                    int(job.get("views") or 0),
                    json.dumps(job.get("steps") or ["Request received", "In progress", "Ready"]),
                ),
            )
        db.commit()
    finally:
        if owns_connection:
            db.close()


def job_by_email(email):
    with connect() as db:
        row = db.execute("SELECT * FROM jobs WHERE lower(email) = lower(?) LIMIT 1", (email,)).fetchone()
        if row is None:
            return None
        db.execute("UPDATE jobs SET views = views + 1 WHERE id = ?", (row["id"],))
        db.commit()
        updated = db.execute("SELECT * FROM jobs WHERE id = ?", (row["id"],)).fetchone()
        return row_to_job(updated)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return None
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_json(200, {"ok": True, "database": str(DB_PATH)})
            return
        if parsed.path == "/api/jobs":
            self.send_json(200, {"jobs": list_jobs()})
            return
        if parsed.path == "/api/jobs/by-email":
            email = parse_qs(parsed.query).get("email", [""])[0]
            job = job_by_email(email)
            if job is None:
                self.send_json(404, {"error": "No job found"})
                return
            self.send_json(200, {"job": job})
            return
        super().do_GET()

    def do_PUT(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/jobs":
            self.send_json(404, {"error": "Not found"})
            return
        payload = self.read_json() or {}
        jobs = payload.get("jobs")
        if not isinstance(jobs, list):
            self.send_json(400, {"error": "Expected jobs array"})
            return
        replace_jobs(jobs)
        self.send_json(200, {"jobs": list_jobs()})


if __name__ == "__main__":
    init_db()
    servers = [ThreadingHTTPServer(("0.0.0.0", PORT), Handler)]
    if FALLBACK_PORT and FALLBACK_PORT != PORT:
        try:
            servers.append(ThreadingHTTPServer(("0.0.0.0", FALLBACK_PORT), Handler))
        except OSError as error:
            print(f"Fallback port {FALLBACK_PORT} disabled: {error}")

    for server in servers[1:]:
        threading.Thread(target=server.serve_forever, daemon=True).start()

    ports = ", ".join(str(server.server_address[1]) for server in servers)
    print(f"SyntraLink status portal listening on ports: {ports}")
    print(f"SQLite database: {DB_PATH}")
    servers[0].serve_forever()
