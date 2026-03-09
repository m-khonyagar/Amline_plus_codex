"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { apiBaseUrl, clearTokens, getTokens, setTokens } from "./lib/api";

const mobileSchema = z.string().min(10);

type Step = "mobile" | "code";

export default function Page() {
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const base = useMemo(() => apiBaseUrl(), []);

  async function sendOtp() {
    setErr(null);
    const m = mobile.trim();
    const ok = mobileSchema.safeParse(m);
    if (!ok.success) {
      setErr("شماره موبایل معتبر نیست.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(`${base}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: m })
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { ok: boolean; dev_code?: string };
      setDevCode(data.dev_code || null);
      setStep("code");
    } catch (e: any) {
      setErr(e?.message || "خطا در ارسال کد.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`${base}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim(), code: code.trim() })
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { access_token: string; refresh_token: string };
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
      window.location.href = "/app";
    } catch (e: any) {
      setErr(e?.message || "کد نامعتبر است.");
    } finally {
      setBusy(false);
    }
  }

  const loggedIn = typeof window !== "undefined" && !!getTokens();

  return (
    <main className="container" style={{ padding: "52px 0" }}>
      <div className="card">
        <div className="header">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 className="title">املاین</h1>
            <span className="badge">آدرس API: {base}</span>
          </div>
          <p className="subtitle">
            ورود با OTP برای اجرای MVP. منطق اصلی در بک‌اند است و این رابط فقط برای تست سریع تیمی و صحت‌سنجی سرویس‌هاست.
          </p>
          {loggedIn ? (
            <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={() => {
                  clearTokens();
                  window.location.reload();
                }}
              >
                خروج
              </button>
              <a className="btn btnPrimary" href="/app">
                ورود به داشبورد
              </a>
            </div>
          ) : null}
        </div>

        <div style={{ padding: "0 26px 26px 26px" }}>
          <div className="grid">
            <section className="card" style={{ padding: 18, boxShadow: "none" }}>
              {err ? <div className="notice error">{err}</div> : null}

              {step === "mobile" ? (
                <>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">شماره موبایل</div>
                    <input
                      className="input"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="مثلا 09123456789"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                    <button className="btn btnPrimary" onClick={sendOtp} disabled={busy}>
                      {busy ? "در حال ارسال..." : "ارسال کد"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">کد تایید</div>
                    <input
                      className="input"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="۶ رقم"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </div>

                  {devCode ? (
                    <div className="notice" style={{ marginTop: 12 }}>
                      کد توسعه (dev): <span style={{ fontFamily: "var(--font-mono), ui-monospace" }}>{devCode}</span>
                    </div>
                  ) : null}

                  <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
                    <button className="btn" onClick={() => setStep("mobile")} disabled={busy}>
                      ویرایش موبایل
                    </button>
                    <button className="btn btnPrimary" onClick={verifyOtp} disabled={busy}>
                      {busy ? "در حال ورود..." : "ورود"}
                    </button>
                  </div>
                </>
              )}
            </section>

            <aside className="card" style={{ padding: 18, boxShadow: "none" }}>
              <div className="badge">وضعیت سامانه (MVP)</div>
              <div className="kv">
                <div className="k">محیط</div>
                <div className="v">dev</div>
              </div>
              <div className="kv">
                <div className="k">اعلان‌ها</div>
                <div className="v">Redis Streams + Worker + DLQ</div>
              </div>
              <div className="kv">
                <div className="k">قرارداد</div>
                <div className="v">UUID + Alembic</div>
              </div>
              <div className="kv">
                <div className="k">قدم بعدی</div>
                <div className="v">پنل ادمین + RBAC</div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
