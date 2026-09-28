import Link from "next/link";
import { ReactNode } from "react";
import { LogoMark } from "./icons";

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
        <Link href="/vendor" className="navlink">
          Dashboard
        </Link>
      </header>
      <main className="content vendor">
        <div className="content-narrow">{children}</div>
      </main>
    </div>
  );
}
