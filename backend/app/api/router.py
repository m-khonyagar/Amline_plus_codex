from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    admin,
    analytics,
    arbitration_summary,
    arbitrations,
    auth,
    campaigns,
    contracts,
    documents,
    notifications,
    payments,
    properties,
    referrals,
    tenant_score,
    users,
    wallet,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(tenant_score.router, prefix="/tenant-score", tags=["tenant-score"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

api_router.include_router(arbitrations.router, prefix="/arbitrations", tags=["arbitrations"])
api_router.include_router(arbitration_summary.router, prefix="/arbitrations", tags=["arbitrations"])

api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
