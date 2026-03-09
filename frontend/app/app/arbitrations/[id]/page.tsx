"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, getTokens } from "../../../lib/api";

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

type ArbitrationSummaryOut = {
  id: string;
  status: string;
  reason: string;
  created_at: string;
  contract_id: string;
  contract_tracking_code?: string | null;
  claimant_id: string;
  claimant_mobile?: string | null;
  respondent_id: string;
  respondent_mobile?: string | null;
  property_id?: string | null;
  property_city?: string | null;
};

type MessageOut = {
  id: string;
  arbitration_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type AttachmentOut = {
  id: string;
  arbitration_id: string;
  uploader_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
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

function kb(n: number) {
  return Math.max(1, Math.round(n / 1024));
}

function statusClass(status: string) {
  if (status === "under_review") return "chip chipWarn";
  if (status === "resolved") return "chip chipOk";
  if (status === "rejected") return "chip chipBad";
  return "chip";
}

export default function ArbitrationDetail({ params }: { params: { id: string } }) {
  const id = params.id;

  const [arb, setArb] = useState<ArbitrationOut | null>(null);
  const [summary, setSummary] = useState<ArbitrationSummaryOut | null>(null);
  const [msgs, setMsgs] = useState<MessageOut[]>([]);
  const [atts, setAtts] = useState<AttachmentOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [body, setBody] = useState("");
  const [nextStatus, setNextStatus] = useState("under_review");
  const [resolution, setResolution] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);

  const closed = arb?.status === "resolved" || arb?.status === "rejected";
  const canWrite = !closed;

  const lastMsg = useMemo(() => (msgs.length ? msgs[msgs.length - 1] : null), [msgs]);

  async function load() {
    setErr(null);
    try {
      const [a, m, at, s] = await Promise.all([
        apiFetch<ArbitrationOut>(`/arbitrations/${id}`),
        apiFetch<MessageOut[]>(`/arbitrations/${id}/messages`),
        apiFetch<AttachmentOut[]>(`/arbitrations/${id}/attachments`),
        apiFetch<ArbitrationSummaryOut>(`/arbitrations/${id}/summary`).catch(() => null)
      ]);

      setArb(a);
      setMsgs(m);
      setAtts(at);
      setSummary(s);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function postMessage() {
    if (!body.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await apiFetch<MessageOut>(`/arbitrations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim() })
      });
      setBody("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function upload() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;

    setBusy(true);
    setErr(null);
    try {
      const tokens = getTokens();
      if (!tokens) throw new Error("unauthorized");

      const form = new FormData();
      form.append("file", f);

      const r = await fetch(`/api/arbitrations/${id}/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        },
        body: form
      });
      if (!r.ok) throw new Error(await r.text());

      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function download(att: AttachmentOut) {
    setBusy(true);
    setErr(null);
    try {
      const p = await apiFetch<Presign>(`/arbitrations/${id}/attachments/${att.id}/presign`);
      window.open(p.url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(`/api/arbitrations/${id}/attachments/${att.id}/download`, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch<ArbitrationOut>(`/arbitrations/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus, resolution: resolution.trim() || null })
      });
      setResolution("");
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
          <h1 className="pageTitle">جزئیات داوری</h1>
          <p className="pageSub">پرونده، پیام‌ها، پیوست‌ها و تغییر وضعیت.</p>
        </div>
        <div className="row">
          <a className="btn" href="/app/arbitrations">بازگشت</a>
          <button className="btn" onClick={load} disabled={busy}>بازخوانی</button>
          <span className={arb ? statusClass(arb.status) : "chip"}>{arb?.status || "..."}</span>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <section className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="badge">پرونده</div>
              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900 }}>
                {summary?.contract_tracking_code || arb?.id || "..."}
              </div>
              <div className="pageSub" style={{ marginTop: 6 }}>
                {summary?.property_city ? `شهر: ${summary.property_city}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div className="badge">طرفین</div>
              <div className="pageSub" style={{ marginTop: 10 }}>
                شاکی: {summary?.claimant_mobile || "-"}
              </div>
              <div className="pageSub" style={{ marginTop: 6 }}>
                طرف مقابل: {summary?.respondent_mobile || "-"}
              </div>
            </div>
          </div>

          <table className="table" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>موضوع</th>
                <th>تاریخ ایجاد</th>
                <th>آخرین پیام</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{arb?.reason || "..."}</td>
                <td>{fmt(arb?.created_at)}</td>
                <td>{lastMsg ? fmt(lastMsg.created_at) : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <section className="panel">
          <div className="panelBody">
            <div className="badge">پیام‌ها</div>
            <div className="row" style={{ marginTop: 12 }}>
              <input className="input" value={body} onChange={(e) => setBody(e.target.value)} placeholder={canWrite ? "پیام جدید..." : "پرونده بسته است"} disabled={busy || !canWrite} />
              <button className="btn btnPrimary" onClick={postMessage} disabled={busy || !canWrite}>ارسال</button>
            </div>

            {msgs.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>پیامی ثبت نشده.</p>
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>زمان</th>
                    <th>متن</th>
                  </tr>
                </thead>
                <tbody>
                  {msgs.slice(-20).map((m) => (
                    <tr key={m.id}>
                      <td>{fmt(m.created_at)}</td>
                      <td>{m.body}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panelBody">
            <div className="badge">پیوست‌ها</div>

            <div className="row" style={{ marginTop: 12 }}>
              <input ref={fileRef} className="input" type="file" disabled={busy || !canWrite} />
              <button className="btn" onClick={upload} disabled={busy || !canWrite}>آپلود</button>
            </div>

            {atts.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>پیوستی وجود ندارد.</p>
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>فایل</th>
                    <th>حجم</th>
                    <th>دانلود</th>
                  </tr>
                </thead>
                <tbody>
                  {atts.slice(0, 12).map((a) => (
                    <tr key={a.id}>
                      <td>{a.filename}</td>
                      <td>{kb(a.size_bytes)} KB</td>
                      <td><button className="btn" onClick={() => download(a)} disabled={busy}>دانلود</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ marginTop: 16 }}>
              <div className="badge">تغییر وضعیت (فقط staff)</div>
              <div className="field" style={{ marginTop: 12 }}>
                <div className="label">وضعیت جدید</div>
                <select className="input" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} disabled={busy}>
                  <option value="under_review">در حال بررسی</option>
                  <option value="resolved">مختومه</option>
                  <option value="rejected">رد شده</option>
                </select>
              </div>
              <div className="field" style={{ marginTop: 10 }}>
                <div className="label">شرح نتیجه (اختیاری)</div>
                <input className="input" value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={busy} />
              </div>
              <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                <button className="btn btnPrimary" onClick={changeStatus} disabled={busy}>اعمال</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
