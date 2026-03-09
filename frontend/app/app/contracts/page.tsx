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

function fmt(ts?: string | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("fa-IR");
  } catch {
    return ts;
  }
}

function statusClass(status: string) {
  if (status === "active" || status === "signed") return "chip chipOk";
  if (status === "draft") return "chip chipWarn";
  if (status === "terminated" || status === "expired") return "chip chipBad";
  return "chip";
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
      if (!pid) throw new Error("ابتدا یک ملک انتخاب کنید.");
      if (!tid) throw new Error("ابتدا مستاجر را با موبایل پیدا کنید.");

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
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">قراردادها</h1>
          <p className="pageSub">ساخت قرارداد با انتخاب ملک از لیست و جستجوی مستاجر با موبایل.</p>
        </div>
        <div className="row">\n          <a className="btn btnPrimary" href="/app/contracts/new">قرارداد جدید</a>\n          <a className="btn" href="/app/properties">ثبت ملک</a>
          <button className="btn" onClick={load} disabled={busy}>
            بازخوانی
          </button>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: "1.15fr 0.85fr" }}>
        <section className="panel">
          <div className="panelBody">
            <div className="badge">ایجاد قرارداد</div>

            <div className="field" style={{ marginTop: 12 }}>
              <div className="label">انتخاب ملک</div>
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
              <div className="label">مستاجر (موبایل)</div>
              <div className="row">
                <input
                  className="input"
                  value={tenantMobile}
                  onChange={(e) => setTenantMobile(e.target.value)}
                  placeholder="مثلا 09123456789"
                  inputMode="tel"
                  disabled={busy}
                />
                <button className="btn" onClick={lookupTenant} disabled={busy || tenantMobile.trim().length < 11}>
                  جستجو
                </button>
              </div>
              <div className="pageSub" style={{ marginTop: 8 }}>
                {tenant ? `یافت شد: ${tenant.name || "-"} (${tenant.mobile})` : "اگر کاربر پیدا نشد، ابتدا باید با همان شماره وارد سیستم شود."}
              </div>
            </div>

            <div className="grid" style={{ marginTop: 12 }}>
              <div>
                <div className="field">
                  <div className="label">نوع قرارداد</div>
                  <input className="input" value={contractType} onChange={(e) => setContractType(e.target.value)} disabled={busy} />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">ودیعه</div>
                  <input className="input" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} disabled={busy} />
                </div>
              </div>
              <div>
                <div className="field">
                  <div className="label">اجاره ماهانه</div>
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
              <button className="btn btnPrimary" onClick={create} disabled={busy || !tenantId}>
                {busy ? "..." : "ایجاد قرارداد"}
              </button>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelBody">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="badge">آخرین قراردادها</div>
              <span className="chip">{recent.length} مورد</span>
            </div>

            {recent.length === 0 ? (
              <p className="pageSub" style={{ marginTop: 10 }}>هنوز قراردادی ندارید.</p>
            ) : (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>کد رهگیری</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.id}>
                      <td><a href={`/app/contracts/${c.id}`}>{c.tracking_code}</a></td>
                      <td><span className={statusClass(c.status)}>{c.status}</span></td>
                      <td>{fmt(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {recent.length > 0 ? (
              <div className="pageSub" style={{ marginTop: 10 }}>
                اجاره و ودیعه را در صفحه جزئیات قرارداد می‌توانید امضا و PDF تولید کنید.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

