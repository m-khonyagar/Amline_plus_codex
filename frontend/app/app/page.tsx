"use client";

import { useEffect, useState } from "react";
import { apiFetch, clearTokens } from "../lib/api";

type Me = {
  id: string;
  mobile: string;
  role: string;
  referral_code?: string | null;
};

type Balance = { user_id: string; balance: number };

type DlqEntry = {
  id: string;
  notification_id: string;
  reason?: string | null;
  attempt: number;
  ts_ms?: number | null;
};

export default function AppHome() {
  const [me, setMe] = useState<Me | null>(null);
  const [bal, setBal] = useState<Balance | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const m = await apiFetch<Me>("/users/me");
        setMe(m);
        const b = await apiFetch<Balance>("/wallet/balance");
        setBal(b);
      } catch (e: any) {
        setErr(e?.message || "خطا");
      }
    })();
  }, []);

  return (
    <main className="container" style={{ padding: "40px 0" }}>
      <div className="card">
        <div className="header">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 className="title">داشبورد</h1>
            <div className="row">
              <a className="btn" href="/app/notifications">
                Notifications
              </a>
              <button
                className="btn"
                onClick={() => {
                  clearTokens();
                  window.location.href = "/";
                }}
              >
                خروج
              </button>
            </div>
          </div>
          <p className="subtitle">نمای MVP برای بررسی سریع سرویس‌ها.</p>
        </div>

        {err ? <div style={{ padding: "0 26px 18px 26px" }}><div className="notice error">{err}</div></div> : null}

        <div className="kv">
          <div className="k">کاربر</div>
          <div className="v">{me ? `${me.mobile} (${me.role})` : "..."}</div>
        </div>
        <div className="kv">
          <div className="k">Wallet</div>
          <div className="v">{bal ? bal.balance : "..."}</div>
        </div>
        <div className="kv">
          <div className="k">Referral Code</div>
          <div className="v">{me?.referral_code || "-"}</div>
        </div>
      </div>
    </main>
  );
}
