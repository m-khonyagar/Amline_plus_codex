from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.wallet import Wallet
from app.models.wallet_transaction import WalletTransaction
from app.models.user import User
from app.schemas.wallet import WalletBalance, WalletTxnOut, WithdrawRequest
from app.services.users_bootstrap import ensure_user_wallet
from app.services.wallet_ledger import add_txn

router = APIRouter()


def _txn_out(t: WalletTransaction) -> WalletTxnOut:
    return WalletTxnOut(
        id=str(t.id),
        wallet_id=str(t.wallet_id),
        amount=float(t.amount),
        type=t.type,
        reference_id=t.reference_id,
        created_at=t.created_at,
    )


@router.get("/balance", response_model=WalletBalance)
def balance(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = ensure_user_wallet(db, user.id)
    db.commit()
    return WalletBalance(user_id=str(user.id), balance=float(w.balance))


@router.get("/transactions", response_model=list[WalletTxnOut])
def transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = ensure_user_wallet(db, user.id)
    db.commit()

    items = db.query(WalletTransaction).filter(WalletTransaction.wallet_id == w.id).order_by(WalletTransaction.created_at.desc()).all()
    return [_txn_out(t) for t in items]


@router.post("/withdraw")
def withdraw(req: WithdrawRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.amount <= 0:
        raise HTTPException(status_code=422, detail="invalid_amount")

    w = ensure_user_wallet(db, user.id)

    # NOTE: this is a stub (no banking integration). We just record and decrement.
    if float(w.balance) < float(req.amount):
        raise HTTPException(status_code=400, detail="insufficient_balance")

    w.balance = float(w.balance) - float(req.amount)
    add_txn(db, wallet=w, amount=-float(req.amount), type="withdraw")

    db.commit()
    return {"ok": True, "balance": float(w.balance)}
