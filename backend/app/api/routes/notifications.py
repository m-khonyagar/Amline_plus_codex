from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut

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
