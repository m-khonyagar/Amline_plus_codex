# Amline_plus_codex

Python backend for **Amline** (PropTech platform).

## Quickstart (dev)

Prereqs: Docker Desktop.

```bash
docker compose up --build
```

API will be available at:
- http://localhost:8000
- OpenAPI: http://localhost:8000/docs

## Notes

- OTP is stored in Redis.
- Postgres is the primary DB.
- Document generation renders Mustache template to HTML and (when `wkhtmltopdf` is available) converts to PDF.
