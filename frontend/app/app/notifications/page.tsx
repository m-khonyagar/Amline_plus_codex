"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type NotificationOut = {
  id: string;
  user_id: string;
  type: string;
  channel: string;
  status: string;
  created_at: string;
};

type DlqEntry = {
  id: string;
  notification_id: string;
  reason?: string | null;
  attempt: number;
  ts_ms?: number | null;
};

function fmt(ts?: string | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("fa-IR");
  } catch {
    return ts;
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationOut[]>([]);
  const [dlq, setDlq] = useState<DlqEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const n = await apiFetch<NotificationOut[]>("/notifications");
      setItems(n);
      const d = await apiFetch<DlqEntry[]>("/notifications/dev/dlq?count=50");
      setDlq(d);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function enqueue() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch<NotificationOut>("/notifications/dev/enqueue?type=demo&channel=sms", { method: "POST" });
      await load();
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function replayAllDlq() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch<{ replayed: number }>("/notifications/dev/dlq/replay", {
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
          <h1 className="pageTitle">اعلان‌ها</h1>
          <p className="pageSub">مشاهده اعلان‌ها و مدیریت DLQ برای محیط توسعه.</p>
        </div>
        <div className="row">
          <button className="btn btnPrimary" onClick={enqueue} disabled={busy}>
            ارسال تست
          </button>
          <button className="btn" onClick={replayAllDlq} disabled={busy}>
            بازپخش DLQ
          </button>
          <button className="btn" onClick={load} disabled={busy}>
            بازخوانی
          </button>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <section className="panel">
          <div className="panelBody">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="badge">آخرین اعلان‌ها</div>
              <span className="chip">{items.slice(0, 12).length} مورد</span>
            </div>
            {items.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>خالی</p>
            ) : (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>نوع</th>
                    <th>کانال</th>
                    <th>وضعیت</th>
                    <th>زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 12).map((n) => (
                    <tr key={n.id}>
                      <td>{n.type}</td>
                      <td>{n.channel}</td>
                      <td><span className="chip">{n.status}</span></td>
                      <td>{fmt(n.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panelBody">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="badge">صف خطا (DLQ)</div>
              <span className="chip">{dlq.slice(0, 12).length} مورد</span>
            </div>
            {dlq.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>خالی</p>
            ) : (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>تلاش</th>
                    <th>دلیل</th>
                  </tr>
                </thead>
                <tbody>
                  {dlq.slice(0, 12).map((d) => (
                    <tr key={d.id}>
                      <td><span className="chip chipWarn">{d.attempt}</span></td>
                      <td>{d.reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
