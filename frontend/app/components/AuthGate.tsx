"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import "../lib/domPatch";
import { getTokens } from "../lib/api";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/app";
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const t = getTokens();
    const ok = !!t?.access_token;
    setAuthed(ok);
    setReady(true);

    if (!ok) {
      // Redirect to login (keeps deep-link intent).
      const next = encodeURIComponent(pathname);
      router.replace(`/?next=${next}`);
    }
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="panel">
        <div className="panelBody">
          <div className="badge">در حال بررسی دسترسی</div>
          <p className="pageSub" style={{ marginTop: 10 }}>...</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="panel">
        <div className="panelBody">
          <div className="badge">نیاز به ورود</div>
          <p className="pageSub" style={{ marginTop: 10 }}>
            برای دسترسی به اپ، ابتدا وارد شوید.
          </p>
          <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <a className="btn btnPrimary" href="/">رفتن به ورود</a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
