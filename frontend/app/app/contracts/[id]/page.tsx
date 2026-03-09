"use client";

import { useEffect, useMemo, useState } from "react";
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

function money(v: number) {
  const rounded = Math.round(v);
  return `${new Intl.NumberFormat("fa-IR").format(rounded)} تومان`;
}

function statusClass(status: string) {
  if (status === "active" || status === "signed") return "chip chipOk";
  if (status === "draft") return "chip chipWarn";
  if (status === "terminated" || status === "expired") return "chip chipBad";
  return "chip";
}

export default function ContractDetail({ params }: { params: { id: string } }) {
  const id = params.id;

  const [c, setC] = useState<ContractOut | null>(null);
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const latest = useMemo(() => (docs.length > 0 ? docs[0] : null), [docs]);

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
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">جزئیات قرارداد</h1>
          <p className="pageSub">امضا، تولید سند و دانلود PDF.</p>
        </div>
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
          {latest ? (
            <button className="btn" onClick={() => openPdf(latest)} disabled={busy}>
              دانلود آخرین PDF
            </button>
          ) : null}
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <section className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="badge">مشخصات</div>
              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900 }}>
                {c ? c.tracking_code : "..."}
              </div>
              <div className="pageSub" style={{ marginTop: 6 }}>
                {c ? `از ${c.start_date} تا ${c.end_date}` : ""}
              </div>
            </div>
            <div className={c ? statusClass(c.status) : "chip"}>
              {c?.status || "..."}
            </div>
          </div>

          <table className="table" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>اجاره</th>
                <th>ودیعه</th>
                <th>property_id</th>
                <th>تاریخ ایجاد</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{c ? money(c.rent_amount) : "..."}</td>
                <td>{c ? money(c.deposit_amount) : "..."}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{c?.property_id || "..."}</td>
                <td>{fmt(c?.created_at)}</td>
              </tr>
            </tbody>
          </table>

          <div className="pageSub" style={{ marginTop: 10 }}>
            نکته: هر طرف قرارداد باید یک بار دکمه «امضا» را بزند تا وضعیت قرارداد به signed تغییر کند.
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="badge">سندها</div>
            <span className="chip">{docs.length} نسخه</span>
          </div>

          {docs.length === 0 ? (
            <p className="pageSub" style={{ marginTop: 10 }}>هنوز سندی تولید نشده. از دکمه «تولید PDF» استفاده کنید.</p>
          ) : (
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>زمان تولید</th>
                  <th>شناسه</th>
                  <th>دانلود</th>
                </tr>
              </thead>
              <tbody>
                {docs.slice(0, 10).map((d) => (
                  <tr key={d.id}>
                    <td>{fmt(d.created_at)}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{d.id}</td>
                    <td>
                      <div className="row">
                        <button className="btn" onClick={() => openHtml(d)} disabled={busy}>
                          HTML
                        </button>
                        <button className="btn btnPrimary" onClick={() => openPdf(d)} disabled={busy}>
                          PDF
                        </button>
                      </div>
                    </td>
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
