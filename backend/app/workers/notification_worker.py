from __future__ import annotations

import datetime as dt
import time
import uuid

import redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.notification import Notification
from app.services.notification_queue import GROUP, STREAM_KEY, ensure_group, get_redis


CONSUMER = f"worker-{uuid.uuid4().hex[:8]}"


def _db() -> Session:
    return SessionLocal()


def process_one(db: Session, notification_id: uuid.UUID) -> None:
    n = db.get(Notification, notification_id)
    if not n:
        return

    # Idempotent: if already processed, do nothing.
    if n.status in {"sent", "failed"}:
        return

    # TODO: integrate actual channels (SMS/Email/Push/Telegram).
    n.status = "sent"
    db.commit()


def main() -> None:
    r = get_redis()
    ensure_group(r)

    while True:
        # '>' reads new messages never delivered to other consumers.
        resp = r.xreadgroup(
            groupname=GROUP,
            consumername=CONSUMER,
            streams={STREAM_KEY: ">"},
            count=10,
            block=5000,
        )

        if not resp:
            continue

        # resp: [(stream, [(id, {field: value}) ...])]
        for _, msgs in resp:
            for msg_id, fields in msgs:
                nid = fields.get("notification_id")
                try:
                    notification_uuid = uuid.UUID(nid)
                except Exception:
                    # Ack malformed messages.
                    r.xack(STREAM_KEY, GROUP, msg_id)
                    continue

                db = _db()
                try:
                    process_one(db, notification_uuid)
                except Exception:
                    # Leave message pending for retries (not acked).
                    db.rollback()
                    db.close()
                    continue
                finally:
                    db.close()

                r.xack(STREAM_KEY, GROUP, msg_id)


if __name__ == "__main__":
    main()
