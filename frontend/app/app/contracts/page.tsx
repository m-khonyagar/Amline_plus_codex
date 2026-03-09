"use client";

import { useEffect, useState } from "react";
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

export default function ContractsPage() {
  const [items, setItems] = useState<ContractOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [propertyId, setPropertyId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [contractType, setContractType] = useState("rent");
  const [depositAmount, setDepositAmount] = useState("10000000");
  const [rentAmount, setRentAmount] = useState("5000000");
  const [startDate, setStartDate] = useState("2026-03-10");
  const [endDate, setEndDate] = useState("2027-03-10");

  async function load() {
    setErr(null);
    try {
      const data = await apiFetch<ContractOut[]>("/contracts");
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
      const c = await apiFetch<ContractOut>("/contracts", {
        method: "POST",
        body: JSON.stringify({
          property_id: propertyId.trim(),
          tenant_id: tenantId.trim(),
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
              <button className="btn" onClick={load} disabled={busy}>
                بازخوانی
              </button>
            </div>
          </div>
          <p className="subtitle">ایجاد قرارداد و ورود به صفحه امضا و تولید PDF.</p>
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
                <div className="label">شناسه ملک (property_id)</div>
                <input className="input" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
              </div>
              <div className="field" style={{ marginTop: 10 }}>
                <div className="label">شناسه مستاجر (tenant_id)</div>
                <input className="input" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
              </div>
              <div className="grid" style={{ marginTop: 12 }}>
                <div>
                  <div className="field">
                    <div className="label">نوع قرارداد</div>
                    <input className="input" value={contractType} onChange={(e) => setContractType(e.target.value)} />
                  </div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">ودیعه (تومان)</div>
                    <input className="input" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="field">
                    <div className="label">اجاره (تومان)</div>
                    <input className="input" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} />
                  </div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <div className="label">شروع / پایان</div>
                    <div className="row">
                      <input className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      <input className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
              {items.length === 0 ? (
                <div className="subtitle" style={{ marginTop: 10 }}>
                  خالی
                </div>
              ) : (
                items.slice(0, 30).map((c) => (
                  <a key={c.id} href={`/app/contracts/${c.id}`} className="kv">
                    <div className="k">{c.status} | {c.tracking_code}</div>
                    <div className="v">rent: {c.rent_amount} | deposit: {c.deposit_amount}</div>
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
