"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">خطا در رابط کاربری</h1>
          <p className="pageSub">یک خطای غیرمنتظره رخ داده است. این نسخه تستی است و امکان بازیابی سریع داریم.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panelBody">
          <div className="badge">جزئیات</div>
          <p className="pageSub" style={{ marginTop: 10 }}>
            اگر افزونه‌هایی مثل VPN یا دستیار مرورگر، عناصر به صفحه تزریق کنند، ممکن است Hydration مشکل پیدا کند.
          </p>
          <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 12, direction: "ltr", textAlign: "left" }}>
            {error?.message || "unknown"}
          </div>
          <div className="row" style={{ marginTop: 14, justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => reset()}>تلاش مجدد</button>
            <a className="btn btnPrimary" href="/">رفتن به ورود</a>
          </div>
        </div>
      </div>
    </div>
  );
}
