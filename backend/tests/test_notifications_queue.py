from __future__ import annotations

import uuid

import redis

from app.core.config import settings
from app.services.notification_queue import STREAM_KEY, enqueue_notification


def test_enqueue_notification_writes_to_stream():
    # We only assert the enqueue call works and the stream has at least one entry.
    r = redis.Redis.from_url(settings.redis_url, decode_responses=True)

    # Use a random UUID; worker/db processing isn't part of this unit test.
    enqueue_notification(notification_id=uuid.uuid4())

    # XRANGE returns list of entries.
    entries = r.xrange(STREAM_KEY, min='-', max='+', count=5)
    assert len(entries) >= 1
