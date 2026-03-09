from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.authz import require_admin_or_moderator
from app.api.deps import get_current_user
from app.core.ids import parse_uuid
from app.db.session import get_db
from app.models.arbitration import Arbitration, ArbitrationStatus
from app.models.contract import Contract
from app.models.user import User
from app.schemas.arbitration import ArbitrationCreate, ArbitrationOut, ArbitrationResolve

router = APIRouter()


def _to_out(a: Arbitration) -> ArbitrationOut:
    return ArbitrationOut(
        id=str(a.id),
        contract_id=str(a.contract_id),
        claimant_id=str(a.claimant_id),
        respondent_id=str(a.respondent_id),
        reason=a.reason,
        description=a.description,
        status=str(a.status.value if hasattr(a.status, "value") else a.status),
        created_at=a.created_at,
        resolved_at=a.resolved_at,
        resolver_id=str(a.resolver_id) if a.resolver_id else None,
        resolution=a.resolution,
    )


def _can_view(user: User, a: Arbitration) -> bool:
    # Admin/moderator can view all.
    if user.role.value in {"Admin", "Moderator"}:
        return True
    return user.id in {a.claimant_id, a.respondent_id}


@router.post("", response_model=ArbitrationOut)
def create_arbitration(
    req: ArbitrationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        cid = parse_uuid(req.contract_id)
        rid = parse_uuid(req.respondent_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_ids")

    c = db.get(Contract, cid)
    if not c:
        raise HTTPException(status_code=404, detail="contract_not_found")

    # Only contract parties can create arbitration.
    if user.id not in {c.owner_id, c.tenant_id}:
        raise HTTPException(status_code=403, detail="forbidden")

    if rid not in {c.owner_id, c.tenant_id} or rid == user.id:
        raise HTTPException(status_code=422, detail="invalid_respondent")

    a = Arbitration(
        contract_id=c.id,
        claimant_id=user.id,
        respondent_id=rid,
        reason=req.reason,
        description=req.description,
        status=ArbitrationStatus.open,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _to_out(a)


@router.get("", response_model=list[ArbitrationOut])
def list_arbitrations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Arbitration).order_by(Arbitration.created_at.desc())

    if user.role.value not in {"Admin", "Moderator"}:
        q = q.filter((Arbitration.claimant_id == user.id) | (Arbitration.respondent_id == user.id))

    return [_to_out(x) for x in q.all()]


@router.get("/{arbitration_id}", response_model=ArbitrationOut)
def get_arbitration(arbitration_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        aid = parse_uuid(arbitration_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_arbitration_id")

    a = db.get(Arbitration, aid)
    if not a:
        raise HTTPException(status_code=404, detail="arbitration_not_found")

    if not _can_view(user, a):
        raise HTTPException(status_code=403, detail="forbidden")

    return _to_out(a)


@router.post("/{arbitration_id}/resolve", response_model=ArbitrationOut)
def resolve_arbitration(
    arbitration_id: str,
    req: ArbitrationResolve,
    resolver: User = Depends(require_admin_or_moderator),
    db: Session = Depends(get_db),
):
    try:
        aid = parse_uuid(arbitration_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_arbitration_id")

    a = db.get(Arbitration, aid)
    if not a:
        raise HTTPException(status_code=404, detail="arbitration_not_found")

    try:
        st = ArbitrationStatus(req.status)
    except Exception:
        raise HTTPException(status_code=422, detail="invalid_status")

    a.status = st
    a.resolution = req.resolution
    a.resolver_id = resolver.id

    if st in {ArbitrationStatus.resolved, ArbitrationStatus.rejected}:
        a.resolved_at = dt.datetime.now(dt.timezone.utc)

    db.commit()
    db.refresh(a)
    return _to_out(a)
