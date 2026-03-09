from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import auth, contracts, documents, properties, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
