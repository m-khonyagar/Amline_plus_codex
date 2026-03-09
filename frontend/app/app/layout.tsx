import type { ReactNode } from "react";

import AuthGate from "../components/AuthGate";
import AppSidebar from "../components/AppSidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="appFrame">
        <AppSidebar />
        <div className="appMain">
          <div className="appContainer">{children}</div>
        </div>
      </div>
    </AuthGate>
  );
}
