from __future__ import annotations

import uuid

import redis

from app.services.notification_queue import DLQ_STREAM_KEY, STREAM_KEY, enqueue_dlq, get_redis, replay_dlq


def test_dlq_replay_moves_message_back_to_stream():
    r = get_redis()

    # Make test deterministic.
    r.delete(STREAM_KEY)
    r.delete(DLQ_STREAM_KEY)

    nid = uuid.uuid4()
    enqueue_dlq(notification_id=nid, reason="process_error", attempt=3)

    # DLQ has the entry.
    dlq_items = r.xrange(DLQ_STREAM_KEY, min='-', max='+')
    assert any(fields.get("notification_id") == str(nid) for _, fields in dlq_items)

    replayed = replay_dlq(notification_id=nid)
    assert replayed == 1

    # Main stream now has the message.
    stream_items = r.xrange(STREAM_KEY, min='-', max='+')
    assert any(fields.get("notification_id") == str(nid) for _, fields in stream_items)

    # DLQ entry removed.
    dlq_items2 = r.xrange(DLQ_STREAM_KEY, min='-', max='+')
    assert not any(fields.get("notification_id") == str(nid) for _, fields in dlq_items2)
