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

function statusClass(status: string) {
  if (status === "under_review") return "chip chipWarn";
  if (status === "resolved") return "chip chipOk";
  if (status === "rejected") return "chip chipBad";
  return "chip";
}

export default function ArbitrationsPage() {
  const [items, setItems] = useState<ArbitrationOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [contractId, setContractId] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [reason, setReason] = useState("payment_dispute");
  const [description, setDescription] = useState("");

  const recent = useMemo(() => items.slice(0, 30), [items]);

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
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">پرونده‌های داوری</h1>
          <p className="pageSub">ثبت پرونده جدید و پیگیری وضعیت.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={load} disabled={busy}>
            بازخوانی
          </button>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "1.05fr 0.95fr" }}>
        <section className="panel">
          <div className="panelBody">
            <div className="badge">ایجاد پرونده</div>
            <div className="grid" style={{ marginTop: 12 }}>
              <div>
                <div className="field">
                  <div className="label">شناسه قرارداد (contract_id)</div>
                  <input className="input" value={contractId} onChange={(e) => setContractId(e.target.value)} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">شناسه طرف مقابل (respondent_id)</div>
                  <input className="input" value={respondentId} onChange={(e) => setRespondentId(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="field">
                  <div className="label">موضوع</div>
                  <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">توضیحات (اختیاری)</div>
                  <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <button className="btn btnPrimary" onClick={create} disabled={busy}>
                    ایجاد
                  </button>
                </div>
              </div>
            </div>

            <div className="pageSub" style={{ marginTop: 10 }}>
              پیشنهاد: از صفحه قراردادها وارد شوید و شناسه قرارداد را کپی کنید.
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelBody">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="badge">آخرین پرونده‌ها</div>
              <span className="chip">{recent.length} مورد</span>
            </div>

            {recent.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>خالی</p>
            ) : (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>وضعیت</th>
                    <th>موضوع</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <a href={`/app/arbitrations/${a.id}`} className={statusClass(a.status)}>
                          {a.status}
                        </a>
                      </td>
                      <td>{a.reason}</td>
                      <td>{fmt(a.created_at)}</td>
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
