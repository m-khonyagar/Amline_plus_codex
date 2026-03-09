from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.services.notification_queue import enqueue_notification

router = APIRouter()


def _to_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=str(n.id),
        user_id=str(n.user_id),
        type=n.type,
        channel=n.channel,
        status=n.status,
        created_at=n.created_at,
    )


@router.get("", response_model=list[NotificationOut])
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).all()
    return [_to_out(x) for x in items]


@router.post("/dev/enqueue", response_model=NotificationOut)
def dev_enqueue(
    type: str,
    channel: str = "sms",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if settings.env != "dev":
        raise HTTPException(status_code=404, detail="not_found")

    n = Notification(user_id=user.id, type=type, channel=channel, status="pending")
    db.add(n)
    db.commit()
    db.refresh(n)

    enqueue_notification(notification_id=n.id)

    return _to_out(n)
