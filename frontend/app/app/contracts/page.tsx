"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

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

type PropertyOut = {
  id: string;
  city: string;
  address: string;
  area: number;
  rooms: number;
  year_built?: number | null;
  property_type: string;
};

type UserLookupOut = { id: string; mobile: string; name?: string | null };

function money(v: number) {
  const rounded = Math.round(v);
  return `${new Intl.NumberFormat("fa-IR").format(rounded)} تومان`;
}

export default function ContractsPage() {
  const [items, setItems] = useState<ContractOut[]>([]);
  const [props, setProps] = useState<PropertyOut[]>([]);

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [propertyId, setPropertyId] = useState("");

  const [tenantMobile, setTenantMobile] = useState("");
  const [tenant, setTenant] = useState<UserLookupOut | null>(null);
  const [tenantId, setTenantId] = useState("");

  const [contractType, setContractType] = useState("rent");
  const [depositAmount, setDepositAmount] = useState("10000000");
  const [rentAmount, setRentAmount] = useState("5000000");
  const [startDate, setStartDate] = useState("2026-03-10");
  const [endDate, setEndDate] = useState("2027-03-10");

  const recent = useMemo(() => items.slice(0, 30), [items]);

  async function load() {
    setErr(null);
    try {
      const [cs, ps] = await Promise.all([
        apiFetch<ContractOut[]>("/contracts"),
        apiFetch<PropertyOut[]>("/properties")
      ]);
      setItems(cs);
      setProps(ps);
      if (!propertyId && ps.length > 0) setPropertyId(ps[0].id);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function lookupTenant() {
    setBusy(true);
    setErr(null);
    try {
      const m = tenantMobile.trim();
      const u = await apiFetch<UserLookupOut>(`/users/lookup?mobile=${encodeURIComponent(m)}`);
      setTenant(u);
      setTenantId(u.id);
    } catch (e: any) {
      setTenant(null);
      setTenantId("");
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const pid = propertyId.trim();
      const tid = tenantId.trim();
      if (!pid) throw new Error("property_id خالی است");
      if (!tid) throw new Error("tenant_id خالی است (ابتدا مستاجر را پیدا کنید)");

      const c = await apiFetch<ContractOut>("/contracts", {
        method: "POST",
        body: JSON.stringify({
          property_id: pid,
          tenant_id: tid,
          contract_type: contractType.trim(),
          deposit_amount: Number(depositAmount),
          rent_amount: Number(rentAmount),
          start_date: startDate,
          end_date: endDate
        })
      });
      window.location.href = `/app/contracts/${c.id}`;
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
            <h1 className="title">قراردادها</h1>
            <div className="row">
              <a className="btn" href="/app">
                داشبورد
              </a>
              <a className="btn" href="/app/properties">
                املاک
              </a>
              <button className="btn" onClick={load} disabled={busy}>
                بازخوانی
              </button>
            </div>
          </div>
          <p className="subtitle">ایجاد قرارداد بدون copy/paste شناسه‌ها: انتخاب ملک از لیست و پیدا کردن مستاجر با موبایل.</p>
        </div>

        {err ? (
          <div style={{ padding: "0 26px 18px 26px" }}>
            <div className="notice error">{err}</div>
          </div>
        ) : null}

        <div style={{ padding: "0 26px 26px 26px" }}>
          <div className="grid">
            <section className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">ایجاد قرارداد</div>

              <div className="field" style={{ marginTop: 12 }}>
                <div className="label">ملک</div>
                <select className="input" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={busy}>
                  {props.length === 0 ? <option value="">(ابتدا ملک ثبت کنید)</option> : null}
                  {props.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.city} | {p.property_type} | {p.rooms} اتاق | {p.area} متر | {p.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginTop: 10 }}>
                <div className="label">موبایل مستاجر</div>
                <div className="row">
                  <input
                    className="input"
                    value={tenantMobile}
                    onChange={(e) => setTenantMobile(e.target.value)}
                    placeholder="مثلا 09123456789"
                    inputMode="tel"
                    disabled={busy}
                  />
                  <button className="btn" onClick={lookupTenant} disabled={busy || tenantMobile.trim().length < 10}>
                    پیدا کردن
                  </button>
                </div>
                <div className="subtitle" style={{ marginTop: 8 }}>
                  {tenant ? `یافت شد: ${tenant.name || "-"} (${tenant.mobile})` : tenantId ? `tenant_id: ${tenantId}` : ""}
                </div>
              </div>

              <div className="grid" style={{ marginTop: 12 }}>
                <div>
                  <div className="field">
                    <div className="label">نوع قرارداد</div>
                    <input className="input" value={contractType} onChange={(e) => setContractType(e.target.value)} disabled={busy} />
                  </div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">ودیعه (تومان)</div>
                    <input className="input" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} disabled={busy} />
                  </div>
                </div>
                <div>
                  <div className="field">
                    <div className="label">اجاره (تومان)</div>
                    <input className="input" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} disabled={busy} />
                  </div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">شروع / پایان (YYYY-MM-DD)</div>
                    <div className="row">
                      <input className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={busy} />
                      <input className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={busy} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                <button className="btn btnPrimary" onClick={create} disabled={busy}>
                  {busy ? "..." : "ایجاد"}
                </button>
              </div>
            </section>

            <section className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="badge">آخرین قراردادها</div>
              {recent.length === 0 ? (
                <div className="subtitle" style={{ marginTop: 10 }}>
                  خالی
                </div>
              ) : (
                recent.map((c) => (
                  <a key={c.id} href={`/app/contracts/${c.id}`} className="kv">
                    <div className="k">{c.status} | {c.tracking_code}</div>
                    <div className="v">اجاره: {money(c.rent_amount)} | ودیعه: {money(c.deposit_amount)}</div>
                  </a>
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
