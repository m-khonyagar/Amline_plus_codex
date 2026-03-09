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
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">ادمین</h1>
          <p className="pageSub">دسترسی ادمین/ناظر و مدیریت DLQ (Production آماده نیست).</p>
        </div>
        <div className="row">
          <a className="btn" href="/app/notifications">
            اعلان‌ها
          </a>
          <button className="btn" onClick={replayAll} disabled={busy}>
            بازپخش DLQ
          </button>
          <button className="btn" onClick={load} disabled={busy}>
            بازخوانی
          </button>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <section className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="badge">حساب</div>
              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900 }}>
                {me ? `${me.mobile} (${me.role})` : "..."}
              </div>
            </div>
            <span className={me?.role === "Admin" || me?.role === "Moderator" ? "chip chipOk" : "chip chipBad"}>
              {me?.role || "..."}
            </span>
          </div>

          <div className="pageSub" style={{ marginTop: 10 }}>
            برای محیط توسعه می‌توانید `AMLINE_BOOTSTRAP_ADMIN_MOBILE` را در compose تنظیم کنید.
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="badge">صف خطا (DLQ)</div>
            <span className="chip">{dlq.length} مورد</span>
          </div>

          {dlq.length === 0 ? (
            <p className="pageSub" style={{ marginTop: 10 }}>خالی</p>
          ) : (
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>تلاش</th>
                  <th>شناسه</th>
                  <th>دلیل</th>
                </tr>
              </thead>
              <tbody>
                {dlq.slice(0, 25).map((d) => (
                  <tr key={d.id}>
                    <td><span className="chip chipWarn">{d.attempt}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{d.notification_id}</td>
                    <td>{d.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
