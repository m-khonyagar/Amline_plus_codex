"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { clearTokens } from "../lib/api";

type NavItem = { href: string; label: string; desc?: string };

const items: NavItem[] = [
  { href: "/app", label: "داشبورد", desc: "نمای کلی" },
  { href: "/app/properties", label: "املاک", desc: "ثبت و مدیریت" },
  { href: "/app/contracts", label: "قراردادها", desc: "امضا و PDF" },
  { href: "/app/arbitrations", label: "داوری", desc: "پرونده‌ها" },
  { href: "/app/analytics", label: "تحلیل‌ها", desc: "بازار و تخمین" },
  { href: "/app/notifications", label: "اعلان‌ها", desc: "DLQ و تست" },
  { href: "/app/admin", label: "ادمین", desc: "دسترسی و DLQ" }
];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppSidebar() {
  const pathname = usePathname() || "/app";

  return (
    <aside className="sidebar">
      <div className="sidebarTop">
        <div className="brand">
          <div className="brandMark" aria-hidden="true">
            A
          </div>
          <div>
            <div className="brandTitle">املاین</div>
            <div className="brandSub">زیرساخت قرارداد و اجاره</div>
          </div>
        </div>
      </div>

      <nav className="nav">
        {items.map((it) => (
          <Link key={it.href} className={"navItem " + (isActive(pathname, it.href) ? "active" : "")} href={it.href}>
            <div className="navLabel">{it.label}</div>
            {it.desc ? <div className="navDesc">{it.desc}</div> : null}
          </Link>
        ))}
      </nav>

      <div className="sidebarBottom">
        <button
          className="btn btnDanger"
          onClick={() => {
            clearTokens();
            window.location.href = "/";
          }}
        >
          خروج
        </button>
        <div className="sidebarHint">MVP داخلی تیم. داده‌ها آزمایشی است.</div>
      </div>
    </aside>
  );
}
