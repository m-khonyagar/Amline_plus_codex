"use client";

import { useEffect, useRef, useState } from "react";
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
      // Prefer S3 presign if available.
      const p = await apiFetch<Presign>(`/arbitrations/${id}/attachments/${att.id}/presign`);
      window.open(p.url, "_blank", "noopener,noreferrer");
    } catch {
      // Fall back to local download endpoint.
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
    <main className="container" style={{ padding: "40px 0" }}>
      <div className="card">
        <div className="header">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 className="title">Arbitration</h1>
            <div className="row">
              <a className="btn" href="/app/arbitrations">
                لیست
              </a>
              <button className="btn" onClick={load} disabled={busy}>
                Refresh
              </button>
            </div>
          </div>
          <p className="subtitle">جزئیات پرونده + پیام‌ها + پیوست‌ها.</p>
        </div>

        {err ? (
          <div style={{ padding: "0 26px 18px 26px" }}>
            <div className="notice error">{err}</div>
          </div>
        ) : null}

        <div className="kv">
          <div className="k">tracking_code</div>
          <div className="v">{summary?.contract_tracking_code || "-"}</div>
        </div>
        <div className="kv">
          <div className="k">property_city</div>
          <div className="v">{summary?.property_city || "-"}</div>
        </div>
        <div className="kv">
          <div className="k">claimant_mobile</div>
          <div className="v">{summary?.claimant_mobile || "-"}</div>
        </div>
        <div className="kv">
          <div className="k">respondent_mobile</div>
          <div className="v">{summary?.respondent_mobile || "-"}</div>
        </div>

        <div className="kv">
          <div className="k">status</div>
          <div className="v">{arb?.status || "..."}</div>
        </div>
        <div className="kv">
          <div className="k">reason</div>
          <div className="v">{arb?.reason || "..."}</div>
        </div>
        <div className="kv">
          <div className="k">created_at</div>
          <div className="v">{fmt(arb?.created_at)}</div>
        </div>
        <div className="kv">
          <div className="k">id</div>
          <div className="v">{arb?.id || "..."}</div>
        </div>

        <div style={{ padding: "0 26px 26px 26px" }}>
          <div className="grid">
            <section className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">Messages</div>
              <div className="row" style={{ marginTop: 10 }}>
                <input
                  className="input"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={closed ? "پرونده بسته است" : "پیام..."}
                  disabled={busy || closed}
                />
                <button className="btn btnPrimary" onClick={postMessage} disabled={busy || closed}>
                  ارسال
                </button>
              </div>
              <div style={{ marginTop: 10 }}>
                {msgs.length === 0 ? (
                  <div className="subtitle">خالی</div>
                ) : (
                  msgs.slice(-30).map((m) => (
                    <div key={m.id} className="kv">
                      <div className="k">
                        {m.author_id.slice(0, 8)} | {fmt(m.created_at)}
                      </div>
                      <div className="v">{m.body}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">Attachments</div>
              <div className="row" style={{ marginTop: 10 }}>
                <input ref={fileRef} className="input" type="file" disabled={busy || closed} />
                <button className="btn" onClick={upload} disabled={busy || closed}>
                  Upload
                </button>
              </div>
              <div style={{ marginTop: 10 }}>
                {atts.length === 0 ? (
                  <div className="subtitle">خالی</div>
                ) : (
                  atts.slice(0, 30).map((a) => (
                    <div key={a.id} className="kv">
                      <div className="k">{Math.max(1, Math.round(a.size_bytes / 1024))} KB</div>
                      <div className="v">
                        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                          <span>{a.filename}</span>
                          <button className="btn" onClick={() => download(a)} disabled={busy}>
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="badge">Status</div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">next status (staff only)</div>
                  <select className="input" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} disabled={busy}>
                    <option value="under_review">under_review</option>
                    <option value="resolved">resolved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">resolution</div>
                  <input className="input" value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={busy} />
                </div>
                <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
                  <button className="btn" onClick={changeStatus} disabled={busy}>
                    Apply
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
