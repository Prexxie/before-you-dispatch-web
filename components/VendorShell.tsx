import Link from "next/link";
import { ReactNode } from "react";
import Breadcrumbs, { Crumb } from "./Breadcrumbs";
import { LogoMark } from "./icons";
import LogoutButton from "./LogoutButton";

// Dark green top bar + narrow content column, as in the "Vendor: Create
// Order" and "Vendor: Link Generated" designs.
export default function VendorShell({
  children,
  crumbs,
}: {
  children: ReactNode;
  crumbs?: Crumb[];
}) {
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
        <div className="content-narrow">
          {crumbs && <Breadcrumbs items={crumbs} />}
          {children}
        </div>
      </main>
    </div>
  );
}
