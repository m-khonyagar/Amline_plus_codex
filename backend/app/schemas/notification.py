from __future__ import annotations

import datetime as dt

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    channel: str
    status: str
    created_at: dt.datetime
