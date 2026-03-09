from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from app.models.wallet import Wallet
from app.models.wallet_transaction import WalletTransaction


def add_txn(db: Session, *, wallet: Wallet, amount: float, type: str, reference_id: str | None = None) -> WalletTransaction:
    t = WalletTransaction(wallet_id=wallet.id, amount=amount, type=type, reference_id=reference_id)
    db.add(t)
    return t
