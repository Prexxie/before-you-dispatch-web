import { ReactNode } from "react";
import { LogoMark } from "./icons";

// Same topbar + narrow content column as VendorShell, but without the
// Dashboard link — these pages are for a vendor who isn't signed in yet.
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <header className="topbar">
        <span className="wordmark">
          <LogoMark />
          Before You Dispatch
        </span>
      </header>
      <main className="content vendor">
        <div className="content-narrow">{children}</div>
      </main>
    </div>
  );
}
