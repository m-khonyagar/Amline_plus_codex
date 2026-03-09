"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

type PropertyOut = {
  id: string;
  city: string;
  address: string;
  area: number;
  rooms: number;
  year_built?: number | null;
  property_type: string;
  created_at: string;
};

type UserLookupOut = { id: string; mobile: string; name?: string | null };

type ContractOut = {
  id: string;
  status: string;
  tracking_code: string;
};

type Step = 1 | 2 | 3 | 4;

function moneyStr(v: string) {
  const n = Number(v || "0");
  if (!isFinite(n)) return v;
  return new Intl.NumberFormat("fa-IR").format(Math.round(n));
}

export default function NewContractWizard() {
  const [step, setStep] = useState<Step>(1);

  const [props, setProps] = useState<PropertyOut[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");
  const selectedProp = useMemo(() => props.find((p) => p.id === propertyId) || null, [props, propertyId]);

  const [tenantMobile, setTenantMobile] = useState("");
  const [tenant, setTenant] = useState<UserLookupOut | null>(null);

  const [contractType, setContractType] = useState("rent");
  const [depositAmount, setDepositAmount] = useState("10000000");
  const [rentAmount, setRentAmount] = useState("5000000");
  const [startDate, setStartDate] = useState("2026-03-10");
  const [endDate, setEndDate] = useState("2027-03-10");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadProps() {
    setErr(null);
    try {
      const ps = await apiFetch<PropertyOut[]>("/properties");
      setProps(ps);
      if (!propertyId && ps.length) setPropertyId(ps[0].id);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    }
  }

  useEffect(() => {
    loadProps();
  }, []);

  async function lookupTenant() {
    setBusy(true);
    setErr(null);
    try {
      const u = await apiFetch<UserLookupOut>(`/users/lookup?mobile=${encodeURIComponent(tenantMobile.trim())}`);
      setTenant(u);
      setStep(3);
    } catch (e: any) {
      setTenant(null);
      setErr(e?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function createContract() {
    setBusy(true);
    setErr(null);
    try {
      if (!propertyId) throw new Error("ملک انتخاب نشده");
      if (!tenant) throw new Error("مستاجر انتخاب نشده");

      const c = await apiFetch<ContractOut>("/contracts", {
        method: "POST",
        body: JSON.stringify({
          property_id: propertyId,
          tenant_id: tenant.id,
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
          <h1 className="pageTitle">قرارداد جدید</h1>
          <p className="pageSub">ویزارد مرحله‌ای برای ساخت قرارداد بدون خطای انسانی.</p>
        </div>
        <div className="row">
          <a className="btn" href="/app/contracts">بازگشت</a>
        </div>
      </div>

      {err ? <div className="notice error">{err}</div> : null}

      <div className="panel">
        <div className="panelBody">
          <div className="stepper">
            <div className={"step " + (step === 1 ? "active" : step > 1 ? "done" : "")}>۱. ملک</div>
            <div className={"step " + (step === 2 ? "active" : step > 2 ? "done" : "")}>۲. مستاجر</div>
            <div className={"step " + (step === 3 ? "active" : step > 3 ? "done" : "")}>۳. شرایط</div>
            <div className={"step " + (step === 4 ? "active" : "")}>۴. تایید</div>
          </div>

          {step === 1 ? (
            <div style={{ marginTop: 14 }}>
              <div className="badge">مرحله ۱: انتخاب ملک</div>
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

              {selectedProp ? (
                <div className="pageSub" style={{ marginTop: 10 }}>
                  انتخاب شد: {selectedProp.city} | {selectedProp.property_type} | {selectedProp.rooms} اتاق | {selectedProp.area} متر
                </div>
              ) : null}

              <div className="row" style={{ marginTop: 14, justifyContent: "flex-end" }}>
                <button className="btn" onClick={loadProps} disabled={busy}>بازخوانی املاک</button>
                <button className="btn btnPrimary" onClick={() => setStep(2)} disabled={busy || !propertyId}>
                  ادامه
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div style={{ marginTop: 14 }}>
              <div className="badge">مرحله ۲: انتخاب مستاجر</div>
              <div className="field" style={{ marginTop: 12 }}>
                <div className="label">موبایل مستاجر</div>
                <div className="row">
                  <input className="input" value={tenantMobile} onChange={(e) => setTenantMobile(e.target.value)} placeholder="09123456789" inputMode="tel" disabled={busy} />
                  <button className="btn btnPrimary" onClick={lookupTenant} disabled={busy || tenantMobile.trim().length !== 11}>
                    جستجو
                  </button>
                </div>
                <div className="pageSub" style={{ marginTop: 10 }}>
                  اگر کاربر پیدا نشد، ابتدا باید با همین شماره وارد سیستم شود.
                </div>
              </div>

              <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
                <button className="btn" onClick={() => setStep(1)} disabled={busy}>قبلی</button>
                <button className="btn" onClick={() => setStep(3)} disabled={busy || !tenant}>ادامه</button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div style={{ marginTop: 14 }}>
              <div className="badge">مرحله ۳: شرایط قرارداد</div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
                <div>
                  <div className="field">
                    <div className="label">نوع قرارداد</div>
                    <input className="input" value={contractType} onChange={(e) => setContractType(e.target.value)} disabled={busy} />
                  </div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">ودیعه (تومان)</div>
                    <input className="input" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} disabled={busy} />
                    <div className="pageSub" style={{ marginTop: 6 }}>نمایش: {moneyStr(depositAmount)} تومان</div>
                  </div>
                </div>

                <div>
                  <div className="field">
                    <div className="label">اجاره ماهانه (تومان)</div>
                    <input className="input" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} disabled={busy} />
                    <div className="pageSub" style={{ marginTop: 6 }}>نمایش: {moneyStr(rentAmount)} تومان</div>
                  </div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">مدت (YYYY-MM-DD)</div>
                    <div className="row">
                      <input className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={busy} />
                      <input className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={busy} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
                <button className="btn" onClick={() => setStep(2)} disabled={busy}>قبلی</button>
                <button className="btn btnPrimary" onClick={() => setStep(4)} disabled={busy}>
                  ادامه
                </button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div style={{ marginTop: 14 }}>
              <div className="badge">مرحله ۴: تایید نهایی</div>

              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>آیتم</th>
                    <th>مقدار</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ملک</td>
                    <td>{selectedProp ? `${selectedProp.city} | ${selectedProp.property_type} | ${selectedProp.rooms} اتاق | ${selectedProp.area} متر` : propertyId}</td>
                  </tr>
                  <tr>
                    <td>مستاجر</td>
                    <td>{tenant ? `${tenant.name || "-"} (${tenant.mobile})` : "-"}</td>
                  </tr>
                  <tr>
                    <td>ودیعه</td>
                    <td>{moneyStr(depositAmount)} تومان</td>
                  </tr>
                  <tr>
                    <td>اجاره</td>
                    <td>{moneyStr(rentAmount)} تومان</td>
                  </tr>
                  <tr>
                    <td>مدت</td>
                    <td>{startDate} تا {endDate}</td>
                  </tr>
                </tbody>
              </table>

              <div className="pageSub" style={{ marginTop: 10 }}>
                بعد از ایجاد، وارد صفحه قرارداد می‌شوید تا امضا و تولید PDF انجام شود.
              </div>

              <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
                <button className="btn" onClick={() => setStep(3)} disabled={busy}>قبلی</button>
                <button className="btn btnPrimary" onClick={createContract} disabled={busy || !tenant || !propertyId}>
                  {busy ? "..." : "ایجاد قرارداد"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
