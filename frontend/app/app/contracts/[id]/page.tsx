"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type ContractOut = {
  id: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  contract_type: string;
  deposit_amount: number;
  rent_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  tracking_code: string;
  created_at: string;
};

type DocumentOut = {
  id: string;
  contract_id: string;
  html_s3_key?: string | null;
  pdf_s3_key?: string | null;
  html_local_path?: string | null;
  pdf_local_path?: string | null;
  created_at: string;
};

type Presign = { url: string; expires_in_seconds: number };

function fmt(ts?: string | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("fa-IR");
  } catch {
    return ts;
  }
}

export default function ContractDetail({ params }: { params: { id: string } }) {
  const id = params.id;

  const [c, setC] = useState<ContractOut | null>(null);
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr(null);
    try {
      const [cc, dd] = await Promise.all([
        apiFetch<ContractOut>(`/contracts/${id}`),
        apiFetch<DocumentOut[]>(`/documents/contracts/${id}`).catch(() => [])
      ]);
      setC(cc);
      setDocs(dd);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function sign() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch<ContractOut>(`/contracts/${id}/sign`, {
        method: "POST",
        body: JSON.stringify({ signature_method: "otp" })
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch<DocumentOut>(`/documents/contracts/${id}/generate`, {
        method: "POST"
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function openPdf(d: DocumentOut) {
    setBusy(true);
    setErr(null);
    try {
      const p = await apiFetch<Presign>(`/documents/${d.id}/presign/pdf`);
      window.open(p.url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(`/api/documents/${d.id}/download/pdf`, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  async function openHtml(d: DocumentOut) {
    setBusy(true);
    setErr(null);
    try {
      const p = await apiFetch<Presign>(`/documents/${d.id}/presign/html`);
      window.open(p.url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(`/api/documents/${d.id}/download/html`, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ padding: "40px 0" }}>
      <div className="card">
        <div className="header">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 className="title">قرارداد</h1>
            <div className="row">
              <a className="btn" href="/app/contracts">
                بازگشت
              </a>
              <button className="btn" onClick={load} disabled={busy}>
                بازخوانی
              </button>
              <button className="btn" onClick={sign} disabled={busy}>
                امضا
              </button>
              <button className="btn btnPrimary" onClick={generate} disabled={busy}>
                تولید PDF
              </button>
            </div>
          </div>
          <p className="subtitle">امضا و تولید سند قرارداد (HTML/PDF).</p>
        </div>

        {err ? (
          <div style={{ padding: "0 26px 18px 26px" }}>
            <div className="notice error">{err}</div>
          </div>
        ) : null}

        <div className="kv">
          <div className="k">کد رهگیری</div>
          <div className="v">{c?.tracking_code || "..."}</div>
        </div>
        <div className="kv">
          <div className="k">وضعیت</div>
          <div className="v">{c?.status || "..."}</div>
        </div>
        <div className="kv">
          <div className="k">اجاره / ودیعه</div>
          <div className="v">{c ? `${c.rent_amount} / ${c.deposit_amount}` : "..."}</div>
        </div>
        <div className="kv">
          <div className="k">مدت</div>
          <div className="v">{c ? `${c.start_date} تا ${c.end_date}` : "..."}</div>
        </div>
        <div className="kv">
          <div className="k">property_id</div>
          <div className="v">{c?.property_id || "..."}</div>
        </div>

        <div style={{ padding: "0 26px 26px 26px" }}>
          <section className="card" style={{ padding: 14, boxShadow: "none" }}>
            <div className="badge">سندها</div>
            {docs.length === 0 ? (
              <div className="subtitle" style={{ marginTop: 10 }}>
                هنوز سندی تولید نشده.
              </div>
            ) : (
              docs.slice(0, 10).map((d) => (
                <div key={d.id} className="kv">
                  <div className="k">{fmt(d.created_at)}</div>
                  <div className="v">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span>{d.id}</span>
                      <span className="row">
                        <button className="btn" onClick={() => openHtml(d)} disabled={busy}>
                          HTML
                        </button>
                        <button className="btn btnPrimary" onClick={() => openPdf(d)} disabled={busy}>
                          PDF
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
