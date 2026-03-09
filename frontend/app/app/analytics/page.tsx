"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type MarketRentSummaryOut = {
  city: string;
  property_type?: string | null;
  rooms?: number | null;
  area?: number | null;
  window_days: number;
  sample_size: number;
  avg_rent_amount?: number | null;
  median_rent_amount?: number | null;
  p25_rent_amount?: number | null;
  p75_rent_amount?: number | null;
  avg_deposit_amount?: number | null;
  median_deposit_amount?: number | null;
  avg_rent_per_sqm?: number | null;
  median_rent_per_sqm?: number | null;
  last_contract_created_at?: string | null;
};

type RentEstimateOut = {
  estimate_rent_amount: number;
  low_rent_amount: number;
  high_rent_amount: number;
  sample_size: number;
  confidence: number;
  method: string;
};

type PropertyPerformanceOut = {
  property_id: string;
  city: string;
  property_type: string;
  owner_id: string;
  total_contracts: number;
  active_contracts: number;
  total_rent_collected: number;
  last_rent_payment_at?: string | null;
};

function fmt(ts?: string | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("fa-IR");
  } catch {
    return ts;
  }
}

function money(v?: number | null) {
  if (v === null || v === undefined) return "-";
  const rounded = Math.round(v);
  return `${new Intl.NumberFormat("fa-IR").format(rounded)} تومان`;
}

function num(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return new Intl.NumberFormat("fa-IR").format(v);
}

export default function AnalyticsPage() {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [city, setCity] = useState("Tehran");
  const [propertyType, setPropertyType] = useState("apartment");
  const [rooms, setRooms] = useState("2");
  const [area, setArea] = useState("85");
  const [summary, setSummary] = useState<MarketRentSummaryOut | null>(null);

  const [eCity, setECity] = useState("Tehran");
  const [ePropertyType, setEPropertyType] = useState("apartment");
  const [eRooms, setERooms] = useState("2");
  const [eArea, setEArea] = useState("85");
  const [eYearBuilt, setEYearBuilt] = useState("1398");
  const [estimate, setEstimate] = useState<RentEstimateOut | null>(null);

  const [propertyId, setPropertyId] = useState("");
  const [perf, setPerf] = useState<PropertyPerformanceOut | null>(null);

  async function loadSummary() {
    setBusy(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      qs.set("city", city.trim());
      if (propertyType.trim()) qs.set("property_type", propertyType.trim());
      if (rooms.trim()) qs.set("rooms", rooms.trim());
      if (area.trim()) qs.set("area", area.trim());
      qs.set("window_days", "365");

      const s = await apiFetch<MarketRentSummaryOut>(`/analytics/market/rent-summary?${qs.toString()}`);
      setSummary(s);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function runEstimate() {
    setBusy(true);
    setErr(null);
    try {
      const r = await apiFetch<RentEstimateOut>("/analytics/rent-estimate", {
        method: "POST",
        body: JSON.stringify({
          city: eCity.trim(),
          property_type: ePropertyType.trim() || null,
          rooms: eRooms.trim() ? Number(eRooms.trim()) : null,
          area: Number(eArea.trim()),
          year_built: eYearBuilt.trim() ? Number(eYearBuilt.trim()) : null
        })
      });
      setEstimate(r);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function loadPerf() {
    if (!propertyId.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const p = await apiFetch<PropertyPerformanceOut>(`/analytics/properties/${propertyId.trim()}/performance`);
      setPerf(p);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">تحلیل‌ها</h1>
          <p className="pageSub">خلاصه بازار اجاره، تخمین اجاره و عملکرد ملک (MVP).</p>
        </div>
        <div className="row">
          <button className="btn" onClick={loadSummary} disabled={busy}>
            بازخوانی
          </button>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel">
          <div className="panelBody">
            <div className="badge">خلاصه بازار اجاره</div>

            <div className="grid" style={{ marginTop: 12 }}>
              <div>
                <div className="field">
                  <div className="label">شهر</div>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">نوع ملک (اختیاری)</div>
                  <input className="input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} disabled={busy} />
                </div>
              </div>
              <div>
                <div className="field">
                  <div className="label">اتاق (اختیاری)</div>
                  <input className="input" value={rooms} onChange={(e) => setRooms(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">متراژ (اختیاری)</div>
                  <input className="input" value={area} onChange={(e) => setArea(e.target.value)} disabled={busy} />
                </div>
                <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <button className="btn btnPrimary" onClick={loadSummary} disabled={busy}>
                    محاسبه
                  </button>
                </div>
              </div>
            </div>

            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>نمونه</th>
                  <th>میانه اجاره</th>
                  <th>چارک ۲۵/۷۵</th>
                  <th>میانه هر متر</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{summary ? num(summary.sample_size) : "..."}</td>
                  <td>{summary ? money(summary.median_rent_amount) : "..."}</td>
                  <td>{summary ? `${money(summary.p25_rent_amount)} / ${money(summary.p75_rent_amount)}` : "..."}</td>
                  <td>{summary ? money(summary.median_rent_per_sqm) : "..."}</td>
                </tr>
              </tbody>
            </table>

            <div className="pageSub" style={{ marginTop: 10 }}>
              آخرین قرارداد: {summary ? fmt(summary.last_contract_created_at) : "..."}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelBody">
            <div className="badge">تخمین اجاره</div>

            <div className="grid" style={{ marginTop: 12 }}>
              <div>
                <div className="field">
                  <div className="label">شهر</div>
                  <input className="input" value={eCity} onChange={(e) => setECity(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">نوع ملک</div>
                  <input className="input" value={ePropertyType} onChange={(e) => setEPropertyType(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">سال ساخت (اختیاری)</div>
                  <input className="input" value={eYearBuilt} onChange={(e) => setEYearBuilt(e.target.value)} disabled={busy} />
                </div>
              </div>
              <div>
                <div className="field">
                  <div className="label">اتاق</div>
                  <input className="input" value={eRooms} onChange={(e) => setERooms(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">متراژ</div>
                  <input className="input" value={eArea} onChange={(e) => setEArea(e.target.value)} disabled={busy} />
                </div>
                <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <button className="btn btnPrimary" onClick={runEstimate} disabled={busy}>
                    تخمین
                  </button>
                </div>
              </div>
            </div>

            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>تخمین</th>
                  <th>بازه</th>
                  <th>اعتماد</th>
                  <th>نمونه</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{estimate ? money(estimate.estimate_rent_amount) : "..."}</td>
                  <td>{estimate ? `${money(estimate.low_rent_amount)} تا ${money(estimate.high_rent_amount)}` : "..."}</td>
                  <td>{estimate ? estimate.confidence : "..."}</td>
                  <td>{estimate ? num(estimate.sample_size) : "..."}</td>
                </tr>
              </tbody>
            </table>

            <div className="pageSub" style={{ marginTop: 10 }}>
              روش: {estimate ? estimate.method : "..."}
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panelBody">
          <div className="badge">عملکرد ملک (مالک یا staff)</div>
          <div className="row" style={{ marginTop: 12 }}>
            <input className="input" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="property_id" disabled={busy} />
            <button className="btn btnPrimary" onClick={loadPerf} disabled={busy || !propertyId.trim()}>
              بارگذاری
            </button>
          </div>

          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>تعداد قرارداد</th>
                <th>فعال</th>
                <th>وصول اجاره</th>
                <th>آخرین پرداخت</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{perf ? num(perf.total_contracts) : "-"}</td>
                <td>{perf ? num(perf.active_contracts) : "-"}</td>
                <td>{perf ? money(perf.total_rent_collected) : "-"}</td>
                <td>{perf ? fmt(perf.last_rent_payment_at) : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
