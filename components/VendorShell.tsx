import Link from "next/link";
import { ReactNode } from "react";
import Breadcrumbs, { Crumb } from "./Breadcrumbs";
import { LiveAttentionPill } from "./AttentionCount";
import { LogoMark } from "./icons";
import { ProfileMenu } from "./Profile";

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
          <span className="inline-flex items-center justify-center rounded-md bg-white p-1">
            <LogoMark size={20} />
          </span>
          WakaRoute
        </Link>
        <div className="topbar-actions">
          <Link href="/vendor" className="navlink">
            Dashboard
            <LiveAttentionPill />
          </Link>
          <ProfileMenu />
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
