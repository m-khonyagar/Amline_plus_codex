"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

type ArbitrationOut = {
  id: string;
  contract_id: string;
  claimant_id: string;
  respondent_id: string;
  reason: string;
  description?: string | null;
  status: string;
  created_at: string;
  resolved_at?: string | null;
  resolver_id?: string | null;
  resolution?: string | null;
};

function fmt(ts?: string | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("fa-IR");
  } catch {
    return ts;
  }
}

export default function ArbitrationsPage() {
  const [items, setItems] = useState<ArbitrationOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [contractId, setContractId] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [reason, setReason] = useState("payment_dispute");
  const [description, setDescription] = useState("");

  async function load() {
    setErr(null);
    try {
      const data = await apiFetch<ArbitrationOut[]>("/arbitrations");
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const a = await apiFetch<ArbitrationOut>("/arbitrations", {
        method: "POST",
        body: JSON.stringify({
          contract_id: contractId.trim(),
          respondent_id: respondentId.trim(),
          reason: reason.trim(),
          description: description.trim() || null
        })
      });
      window.location.href = `/app/arbitrations/${a.id}`;
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
            <h1 className="title">Arbitrations</h1>
            <div className="row">
              <a className="btn" href="/app">
                داشبورد
              </a>
              <button className="btn" onClick={load} disabled={busy}>
                Refresh
              </button>
            </div>
          </div>
          <p className="subtitle">لیست پرونده‌ها + ایجاد پرونده جدید.</p>
        </div>

        {err ? (
          <div style={{ padding: "0 26px 18px 26px" }}>
            <div className="notice error">{err}</div>
          </div>
        ) : null}

        <div style={{ padding: "0 26px 26px 26px" }}>
          <section className="card" style={{ padding: 14, boxShadow: "none" }}>
            <div className="badge">Create</div>
            <div className="grid" style={{ marginTop: 12 }}>
              <div>
                <div className="field">
                  <div className="label">contract_id</div>
                  <input className="input" value={contractId} onChange={(e) => setContractId(e.target.value)} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">respondent_id</div>
                  <input className="input" value={respondentId} onChange={(e) => setRespondentId(e.target.value)} />
                </div>
              </div>

              <div>
                <div className="field">
                  <div className="label">reason</div>
                  <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">description</div>
                  <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <button className="btn btnPrimary" onClick={create} disabled={busy}>
                    {busy ? "..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 14, boxShadow: "none", marginTop: 14 }}>
            <div className="badge">Recent</div>
            {items.length === 0 ? (
              <div className="subtitle" style={{ marginTop: 10 }}>خالی</div>
            ) : (
              items.slice(0, 30).map((a) => (
                <a key={a.id} href={`/app/arbitrations/${a.id}`} className="kv">
                  <div className="k">{a.status} | {fmt(a.created_at)}</div>
                  <div className="v">{a.reason} | {a.id}</div>
                </a>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
