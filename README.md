# Amline_plus_codex

Python backend for **Amline** (PropTech platform).

## Quickstart (dev)

Prereqs: Docker Desktop.

```bash
docker compose up -d --build
```

API will be available at:\n- http://localhost:8088\n- OpenAPI: http://localhost:8088/docs\n\nWeb UI will be available at:\n- http://localhost:3088/app

## Notes

- OTP is stored in Redis.
- Postgres is the primary DB.
- Document generation renders Mustache template to HTML and (when `wkhtmltopdf` is available) converts to PDF.
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
- In the browser, requests go to the frontend origin (no CORS headaches).

\n\n## Browser issues (extensions)\n\nIf you see a blank page in Edge/Chrome due to browser extensions injecting DOM (hydration errors), you can launch Edge with extensions disabled:\n\n`powershell\n.\\scripts\\open_edge_safe.ps1 -Url 'http://localhost:3088/app'\n`\n
