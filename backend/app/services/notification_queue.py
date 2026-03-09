from __future__ import annotations

import time
import uuid

import redis

from app.core.config import settings


STREAM_KEY = "notifications"
GROUP = "amline"


def get_redis() -> redis.Redis:
    return redis.Redis.from_url(settings.redis_url, decode_responses=True)


def ensure_group(r: redis.Redis) -> None:
    try:
        # MKSTREAM creates stream if it doesn't exist.
        r.xgroup_create(name=STREAM_KEY, groupname=GROUP, id="0", mkstream=True)
    except redis.exceptions.ResponseError as e:
        # BUSYGROUP means it already exists.
        if "BUSYGROUP" not in str(e):
            raise


def enqueue_notification(*, notification_id: uuid.UUID) -> str:
    r = get_redis()
    ensure_group(r)
    msg_id = r.xadd(STREAM_KEY, {"notification_id": str(notification_id)})
    return msg_id
