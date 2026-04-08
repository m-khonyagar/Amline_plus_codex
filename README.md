# Amline Plus Codex

Full-stack Amline workspace with a Python backend, Next.js frontend, and Docker-based local stack.

## Scope
This repository is a compact product workspace with:
- `backend/` for the application API and workers
- `frontend/` for the web app
- `scripts/` for local developer helpers

## Quickstart (dev)
Prerequisite: Docker Desktop.

```bash
docker compose up -d --build
```

API endpoints:
- `http://localhost:8088`
- `http://localhost:8088/docs`

Web UI:
- `http://localhost:3088/app`

## Notes
- OTP is stored in Redis.
- Postgres is the primary database.
- Document generation renders Mustache templates to HTML and converts to PDF when `wkhtmltopdf` is available.

## Ports
If ports are already in use on your machine, you can override published ports:

```bat
set AMLINE_API_PORT=18088
set AMLINE_MINIO_PORT=19000
set AMLINE_MINIO_CONSOLE_PORT=19101
docker compose up -d --build
```

## Frontend proxy
The Next.js frontend calls the backend through a server-side proxy at `/api/*`.

- In Docker, the frontend uses `AMLINE_API_INTERNAL_URL=http://backend:8000`.
- In the browser, requests go to the frontend origin.

## Browser issues (extensions)
If you see a blank page in Edge/Chrome because browser extensions inject DOM and trigger hydration errors, launch Edge with extensions disabled:

```powershell
.\scripts\open_edge_safe.ps1 -Url 'http://localhost:3088/app'
```
