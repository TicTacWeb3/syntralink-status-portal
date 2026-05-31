# SyntraLink Reddit Demo - L-0501

Lead: L-0501 - u/Waste_Dragonfruit346  
Source: Public Reddit post  
Post: https://www.reddit.com/r/smallbusiness/comments/1tsqovs/service_business_owners_how_do_you_stop_customers/  
Content date: 2026-05-31T09:36:27Z

## Exact Pain

The post asks how service business owners can stop customers from repeatedly asking “is it ready?” after a job has already been booked or dropped off. The need is a simple software/CRM/customer portal that shows job status and reduces manual calls or messages.

## Demo Built

Work status management for service businesses, based on the Reddit comments:
- protected admin dashboard with demo password (`demo123`);
- customer/job CRUD with email, status, current step, public note, and next promised update;
- bulk import from Excel (`.xlsx`, `.xls`) or CSV for existing customer lists;
- separate customer portal (`customer.html`) where the customer enters their email and sees only their own process;
- same-viewport customer result panel, so customers do not need to scroll after entering their email;
- customer timeline with status, current blocker, visual proof placeholder, and next promised update;
- expectations clause for estimates or booking confirmations.

## How To Open

With Docker Compose:
```bash
docker compose up --build
```

For SyntraNet, upload only `docker-compose.yml`. It does not require the project folder or a local Docker build: the service uses the prebuilt public image `ghcr.io/tictacweb3/syntralink-status-portal:latest`, exposes port `3000`, and stores SQLite data in the `syntralink-db` volume.

Admin dashboard:
http://127.0.0.1:3000/index.html

Customer portal:
http://127.0.0.1:3000/customer.html

Health check:
http://127.0.0.1:3000/api/health

The Docker setup runs a minimal Python server with a SQLite database stored in the `syntralink-db` Docker volume. Admin changes, Excel/CSV imports, and customer portal views persist in that database.

Local file fallback:
file:///home/endre/syntralink-reddit-demos/L-0501-reddit-waste-dragonfruit346-status-portal/index.html

When opened directly as static files, the app falls back to browser `localStorage`.

Demo admin password:
`demo123`

Demo customer email:
`marco.rossi@email.it`

## Mock Data

All customers and jobs in the demo are fictional and exist only to demonstrate the workflow. No private Reddit data is used.

## SyntraLink Sales Angle

Minimum wedge: “In one week, I can set up a lightweight job-status portal, update rules, and ready-to-send customer messages, so customers have a place to check before calling you.”
