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
    <main className="container" style={{ padding: "40px 0" }}>
      <div className="card">
        <div className="header">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 className="title">Notifications</h1>
            <div className="row">
              <a className="btn" href="/app">داشبورد</a>
              <button className="btn btnPrimary" onClick={enqueue} disabled={busy}>
                {busy ? "..." : "Dev Enqueue"}
              </button>
              <button className="btn" onClick={replayAllDlq} disabled={busy}>
                Replay DLQ
              </button>
            </div>
          </div>
          <p className="subtitle">لیست نوتیفیکیشن‌ها و DLQ (dev-only).</p>
        </div>

        {err ? <div style={{ padding: "0 26px 18px 26px" }}><div className="notice error">{err}</div></div> : null}

        <div style={{ padding: "0 26px 26px 26px" }}>
          <div className="grid">
            <section className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">Recent</div>
              {items.length === 0 ? (
                <div className="subtitle" style={{ marginTop: 10 }}>خالی</div>
              ) : (
                items.slice(0, 12).map((n) => (
                  <div key={n.id} className="kv">
                    <div className="k">{n.type}</div>
                    <div className="v">{n.status} | {n.channel}</div>
                  </div>
                ))
              )}
            </section>

            <aside className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">DLQ</div>
              {dlq.length === 0 ? (
                <div className="subtitle" style={{ marginTop: 10 }}>خالی</div>
              ) : (
                dlq.slice(0, 12).map((d) => (
                  <div key={d.id} className="kv">
                    <div className="k">attempt {d.attempt}</div>
                    <div className="v">{d.reason || "-"}</div>
                  </div>
                ))
              )}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
