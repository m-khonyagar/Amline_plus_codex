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

export default function ArbitrationDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [arb, setArb] = useState<ArbitrationOut | null>(null);
  const [msgs, setMsgs] = useState<MessageOut[]>([]);
  const [atts, setAtts] = useState<AttachmentOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [body, setBody] = useState("");
  const [nextStatus, setNextStatus] = useState("under_review");
  const [resolution, setResolution] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setErr(null);
    try {
      const a = await apiFetch<ArbitrationOut>(`/arbitrations/${id}`);
      setArb(a);
      const m = await apiFetch<MessageOut[]>(`/arbitrations/${id}/messages`);
      setMsgs(m);
      const at = await apiFetch<AttachmentOut[]>(`/arbitrations/${id}/attachments`);
      setAtts(at);
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
              <a className="btn" href="/app/arbitrations">لیست</a>
              <button className="btn" onClick={load} disabled={busy}>Refresh</button>
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
          <div className="k">status</div>
          <div className="v">{arb?.status || "..."}</div>
        </div>
        <div className="kv">
          <div className="k">reason</div>
          <div className="v">{arb?.reason || "..."}</div>
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
                <input className="input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="پیام..." />
                <button className="btn btnPrimary" onClick={postMessage} disabled={busy}>ارسال</button>
              </div>
              <div style={{ marginTop: 10 }}>
                {msgs.length === 0 ? (
                  <div className="subtitle">خالی</div>
                ) : (
                  msgs.slice(-25).map((m) => (
                    <div key={m.id} className="kv">
                      <div className="k">{m.author_id.slice(0, 8)}</div>
                      <div className="v">{m.body}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">Attachments</div>
              <div className="row" style={{ marginTop: 10 }}>
                <input ref={fileRef} className="input" type="file" />
                <button className="btn" onClick={upload} disabled={busy}>Upload</button>
              </div>
              <div style={{ marginTop: 10 }}>
                {atts.length === 0 ? (
                  <div className="subtitle">خالی</div>
                ) : (
                  atts.slice(0, 20).map((a) => (
                    <div key={a.id} className="kv">
                      <div className="k">{Math.round(a.size_bytes / 1024)} KB</div>
                      <div className="v">{a.filename}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="badge">Status</div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">next status</div>
                  <input className="input" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} placeholder="under_review | resolved | rejected" />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">resolution</div>
                  <input className="input" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                </div>
                <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
                  <button className="btn" onClick={changeStatus} disabled={busy}>Apply</button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
