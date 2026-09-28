import { ReactNode } from "react";
import { LogoMark } from "./icons";

// Design: "Vendor: Sign Up" / "Vendor: Log In" / "Vendor: Set Up Workspace".
// A centered logo lockup above a narrow card — no topbar, since these pages
// are for a vendor who isn't signed in (or mid-signup) yet.
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <main className="content auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <LogoMark />
            Before You Dispatch
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
