from __future__ import annotations

import time
import uuid

import redis

from app.core.config import settings


STREAM_KEY = "notifications"
DLQ_STREAM_KEY = "notifications:dlq"
GROUP = "amline"


def get_redis() -> redis.Redis:
    return redis.Redis.from_url(settings.redis_url, decode_responses=True)


def ensure_group(r: redis.Redis) -> None:
    try:
        r.xgroup_create(name=STREAM_KEY, groupname=GROUP, id="0", mkstream=True)
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise


def now_ms() -> int:
    return int(time.time() * 1000)


def compute_backoff_seconds(attempt: int) -> int:
    # Exponential backoff capped.
    base = max(1, int(getattr(settings, "notification_retry_base_seconds", 5)))
    cap = max(base, int(getattr(settings, "notification_retry_max_seconds", 300)))
    # attempt starts at 1
    delay = base * (2 ** max(0, attempt - 1))
    return int(min(delay, cap))


def enqueue_notification(*, notification_id: uuid.UUID, attempt: int = 0, visible_at_ms: int | None = None) -> str:
    """Enqueue a notification for the worker.

    visible_at_ms: if set, worker should not process until now_ms() >= visible_at_ms.
    """
    r = get_redis()
    ensure_group(r)
    payload = {
        "notification_id": str(notification_id),
        "attempt": str(int(attempt)),
    }
    if visible_at_ms is not None:
        payload["visible_at_ms"] = str(int(visible_at_ms))
    msg_id = r.xadd(STREAM_KEY, payload)
    return msg_id


def enqueue_dlq(*, notification_id: uuid.UUID, reason: str, attempt: int) -> str:
    r = get_redis()
    payload = {
        "notification_id": str(notification_id),
        "reason": reason,
        "attempt": str(int(attempt)),
        "ts_ms": str(now_ms()),
    }
    return r.xadd(DLQ_STREAM_KEY, payload)
