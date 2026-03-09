"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Me = { id: string; mobile: string; role: string };

type DlqEntry = {
  id: string;
  notification_id: string;
  reason?: string | null;
  attempt: number;
  ts_ms?: number | null;
};

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [dlq, setDlq] = useState<DlqEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const m = await apiFetch<Me>("/users/me");
      setMe(m);
      const d = await apiFetch<DlqEntry[]>("/admin/notifications/dlq?count=50");
      setDlq(d);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function replayAll() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch<{ replayed: number }>("/admin/notifications/dlq/replay", {
        method: "POST",
        body: JSON.stringify({ count: 200 })
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ padding: "40px 0" }}>
      <div className="card">
        <div className="header">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 className="title">ادمین</h1>
            <div className="row">
              <a className="btn" href="/app">
                داشبورد
              </a>
              <a className="btn" href="/app/notifications">
                اعلان‌ها
              </a>
              <button className="btn" onClick={replayAll} disabled={busy}>
                بازپخش DLQ
              </button>
            </div>
          </div>
          <p className="subtitle">
            این صفحه نیاز به نقش Admin/Moderator دارد. برای محیط توسعه می‌توانید `AMLINE_BOOTSTRAP_ADMIN_MOBILE` را در compose تنظیم کنید.
          </p>
        </div>

        {err ? (
          <div style={{ padding: "0 26px 18px 26px" }}>
            <div className="notice error">{err}</div>
          </div>
        ) : null}

        <div className="kv">
          <div className="k">حساب فعلی</div>
          <div className="v">{me ? `${me.mobile} (${me.role})` : "..."}</div>
        </div>

        <div style={{ padding: "0 26px 26px 26px" }}>
          <div className="badge">صف خطا (DLQ)</div>
          {dlq.length === 0 ? (
            <div className="subtitle" style={{ marginTop: 10 }}>
              خالی
            </div>
          ) : (
            dlq.slice(0, 25).map((d) => (
              <div key={d.id} className="kv">
                <div className="k">تلاش {d.attempt}</div>
                <div className="v">{d.notification_id} | {d.reason || "-"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
