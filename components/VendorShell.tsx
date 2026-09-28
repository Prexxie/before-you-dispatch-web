import Link from "next/link";
import { ReactNode } from "react";
import { LogoMark } from "./icons";
import LogoutButton from "./LogoutButton";

// Dark green top bar + narrow content column, as in the "Vendor: Create
// Order" and "Vendor: Link Generated" designs.
export default function VendorShell({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <header className="topbar">
        <Link href="/vendor" className="wordmark">
          <LogoMark />
          Before You Dispatch
        </Link>
        <div className="row-flex" style={{ gap: 20, alignItems: "center" }}>
          <Link href="/vendor" className="navlink">
            Dashboard
          </Link>
          <LogoutButton className="navlink" />
        </div>
      </header>
      <main className="content vendor">
        <div className="content-narrow">{children}</div>
      </main>
    </div>
  );
}
