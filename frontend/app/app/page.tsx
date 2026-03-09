"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Me = {
  id: string;
  mobile: string;
  role: string;
  referral_code?: string | null;
  tenant_score?: number;
};

type Balance = { user_id: string; balance: number };

type ContractOut = { id: string; status: string; tracking_code: string; created_at: string };

type PropertyOut = { id: string; city: string; property_type: string; created_at: string };

type ArbitrationOut = { id: string; status: string; reason: string; created_at: string };

function fmt(ts?: string | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("fa-IR");
  } catch {
    return ts;
  }
}

export default function AppHome() {
  const [me, setMe] = useState<Me | null>(null);
  const [bal, setBal] = useState<Balance | null>(null);
  const [contracts, setContracts] = useState<ContractOut[]>([]);
  const [properties, setProperties] = useState<PropertyOut[]>([]);
  const [arbs, setArbs] = useState<ArbitrationOut[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, b, cs, ps, as] = await Promise.all([
          apiFetch<Me>("/users/me"),
          apiFetch<Balance>("/wallet/balance"),
          apiFetch<any[]>("/contracts").catch(() => []),
          apiFetch<any[]>("/properties").catch(() => []),
          apiFetch<any[]>("/arbitrations").catch(() => [])
        ]);

        setMe(m);
        setBal(b);
        setContracts((cs || []).slice(0, 5));
        setProperties((ps || []).slice(0, 5));
        setArbs((as || []).slice(0, 5));
      } catch (e: any) {
        setErr(e?.message || "خطا");
      }
    })();
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">داشبورد</h1>
          <p className="pageSub">نمای کلی وضعیت حساب، قراردادها و عملیات‌های کلیدی.</p>
        </div>
        <div className="row">
          <a className="btn" href="/app/properties">
            ثبت ملک
          </a>
          <a className="btn btnPrimary" href="/app/contracts">
            ایجاد قرارداد
          </a>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <section className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="badge">حساب</div>
              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800 }}>
                {me ? `${me.mobile} (${me.role})` : "..."}
              </div>
              <div className="subtitle" style={{ marginTop: 6 }}>
                کد معرفی: {me?.referral_code || "-"} | امتیاز مستاجر: {me?.tenant_score ?? "-"}
              </div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div className="badge">کیف پول</div>
              <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, direction: "ltr" }}>
                {bal ? bal.balance : "..."}
              </div>
              <div className="subtitle" style={{ marginTop: 6 }}>
                موجودی فعلی
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel">
          <div className="panelBody">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="badge">آخرین قراردادها</div>
              <a className="btn" href="/app/contracts">
                همه
              </a>
            </div>
            {contracts.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>هنوز قراردادی ندارید.</p>
            ) : (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id}>
                      <td><a href={`/app/contracts/${c.id}`}>{c.tracking_code}</a></td>
                      <td><span className="chip">{c.status}</span></td>
                      <td>{fmt(c.created_at)}</td>
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
              <div className="badge">آخرین املاک</div>
              <a className="btn" href="/app/properties">
                همه
              </a>
            </div>
            {properties.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>برای شروع، یک ملک ثبت کنید.</p>
            ) : (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>شهر</th>
                    <th>نوع</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p.id}>
                      <td>{p.city}</td>
                      <td>{p.property_type}</td>
                      <td>{fmt(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="badge">پرونده‌های داوری</div>
            <a className="btn" href="/app/arbitrations">
              همه
            </a>
          </div>
          {arbs.length === 0 ? (
            <p className="pageSub" style={{ marginTop: 10 }}>پرونده‌ای ثبت نشده.</p>
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
                {arbs.map((a) => (
                  <tr key={a.id}>
                    <td><a href={`/app/arbitrations/${a.id}`} className="chip">{a.status}</a></td>
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
  );
}
