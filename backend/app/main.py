from __future__ import annotations

import uuid

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.services.s3 import ensure_bucket

app = FastAPI(title="Amline API", version="0.1.0")

app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.env}


@app.on_event("startup")
def _startup():
    # Best-effort: in dev we create the bucket automatically.
    ensure_bucket()
