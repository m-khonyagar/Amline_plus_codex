"use client";

import { useEffect, useState } from "react";
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
    <main className="container" style={{ padding: "40px 0" }}>
      <div className="card">
        <div className="header">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 className="title">املاک</h1>
            <div className="row">
              <a className="btn" href="/app">
                داشبورد
              </a>
              <button className="btn" onClick={load} disabled={busy}>
                بازخوانی
              </button>
            </div>
          </div>
          <p className="subtitle">ثبت ملک برای ساخت قرارداد.</p>
        </div>

        {err ? (
          <div style={{ padding: "0 26px 18px 26px" }}>
            <div className="notice error">{err}</div>
          </div>
        ) : null}

        <div style={{ padding: "0 26px 26px 26px" }}>
          <div className="grid">
            <section className="card" style={{ padding: 14, boxShadow: "none" }}>
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
                    <button className="btn btnPrimary" onClick={create} disabled={busy}>
                      {busy ? "..." : "ثبت"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">لیست</div>
              {items.length === 0 ? (
                <div className="subtitle" style={{ marginTop: 10 }}>
                  خالی
                </div>
              ) : (
                items.slice(0, 30).map((p) => (
                  <div key={p.id} className="kv">
                    <div className="k">{p.city} | {p.property_type}</div>
                    <div className="v">{p.address} | {p.rooms} اتاق | {p.area} متر</div>
                  </div>
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
