import type { ReactNode } from "react";

import AppSidebar from "../components/AppSidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="appFrame">
      <AppSidebar />
      <div className="appMain">
        <div className="appContainer">{children}</div>
      </div>
    </div>
  );
}
