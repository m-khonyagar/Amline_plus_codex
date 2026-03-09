"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

type PropertyOut = {
  id: string;
  owner_id: string;
  city: string;
  address: string;
  area: number;
  rooms: number;
  year_built?: number | null;
  property_type: string;
  created_at: string;
};

function fmt(ts?: string | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("fa-IR");
  } catch {
    return ts;
  }
}

export default function PropertiesPage() {
  const [items, setItems] = useState<PropertyOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [city, setCity] = useState("Tehran");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("85");
  const [rooms, setRooms] = useState("2");
  const [yearBuilt, setYearBuilt] = useState("1398");
  const [propertyType, setPropertyType] = useState("apartment");

  const recent = useMemo(() => items.slice(0, 30), [items]);

  async function load() {
    setErr(null);
    try {
      const data = await apiFetch<PropertyOut[]>("/properties");
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
      await apiFetch<PropertyOut>("/properties", {
        method: "POST",
        body: JSON.stringify({
          city: city.trim(),
          address: address.trim(),
          area: Number(area),
          rooms: Number(rooms),
          year_built: yearBuilt.trim() ? Number(yearBuilt) : null,
          property_type: propertyType.trim()
        })
      });
      setAddress("");
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
          <h1 className="pageTitle">املاک</h1>
          <p className="pageSub">ثبت ملک و آماده‌سازی برای ساخت قرارداد.</p>
        </div>
        <div className="row">
          <a className="btn" href="/app/contracts">
            رفتن به قراردادها
          </a>
          <button className="btn" onClick={load} disabled={busy}>
            بازخوانی
          </button>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "1.05fr 0.95fr" }}>
        <section className="panel">
          <div className="panelBody">
            <div className="badge">ثبت ملک</div>

            <div className="grid" style={{ marginTop: 12 }}>
              <div>
                <div className="field">
                  <div className="label">شهر</div>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">آدرس</div>
                  <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} disabled={busy} />
                </div>
              </div>

              <div>
                <div className="field">
                  <div className="label">متراژ</div>
                  <input className="input" value={area} onChange={(e) => setArea(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">اتاق</div>
                  <input className="input" value={rooms} onChange={(e) => setRooms(e.target.value)} disabled={busy} />
                </div>
              </div>
            </div>

            <div className="grid" style={{ marginTop: 12 }}>
              <div>
                <div className="field">
                  <div className="label">سال ساخت (اختیاری)</div>
                  <input className="input" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} disabled={busy} />
                </div>
              </div>
              <div>
                <div className="field">
                  <div className="label">نوع ملک</div>
                  <input className="input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} disabled={busy} />
                </div>
                <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <button className="btn btnPrimary" onClick={create} disabled={busy || !address.trim()}>
                    {busy ? "..." : "ثبت"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pageSub" style={{ marginTop: 10 }}>
              بعد از ثبت ملک، از صفحه قراردادها می‌توانید قرارداد بسازید.
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelBody">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="badge">لیست املاک</div>
              <span className="chip">{recent.length} مورد</span>
            </div>

            {recent.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>هنوز ملکی ثبت نشده.</p>
            ) : (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>شهر</th>
                    <th>نوع</th>
                    <th>مشخصات</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id}>
                      <td>{p.city}</td>
                      <td>{p.property_type}</td>
                      <td>{p.rooms} اتاق | {p.area} متر</td>
                      <td>{fmt(p.created_at)}</td>
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
