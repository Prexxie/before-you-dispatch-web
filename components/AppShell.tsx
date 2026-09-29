import Link from "next/link";
import { ReactNode } from "react";
import { ThemeColor } from "@/lib/api";
import { themeStyle } from "@/lib/theme";
import Breadcrumbs, { Crumb } from "./Breadcrumbs";
import { LogoMark } from "./icons";
import LogoutButton from "./LogoutButton";

type Section = "dashboard" | "create" | "riders" | "settings";

// Design: the trail in the top bar, one level under the dashboard.
function trail(active: Section, title: string): Crumb[] {
  if (active === "dashboard") return [{ label: "Dashboard" }];
  return [{ label: "Dashboard", href: "/vendor" }, { label: title }];
}

// Sidebar + top bar from the "Vendor: Dashboard" design.
export default function AppShell({
  active,
  title,
  businessName,
  businessCategory,
  themeColor,
  children,
}: {
  active: Section;
  title: string;
  businessName: string | null;
  // Design: the sidebar shows the vendor's category under their name
  // ("Food & restaurant"), not anything about today.
  businessCategory: string | null;
  // Design: "Vendor: Settings", Workspace theme. Defaults to the app's own
  // green while the vendor hasn't loaded yet, so nothing flashes untinted.
  themeColor?: ThemeColor;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <div className="app-shell" style={themeStyle(themeColor ?? "green")}>
        <nav className="sidebar" aria-label="Main">
          <div className="sidebar-brand">
            <LogoMark size={18} />
            Before You Dispatch
          </div>
          <div className="sidebar-business">
            <strong>{businessName ?? "Your business"}</strong>
            {businessCategory && <span>{businessCategory}</span>}
          </div>
          <Link
            href="/vendor"
            className={`nav-item ${active === "dashboard" ? "active" : ""}`}
            aria-current={active === "dashboard" ? "page" : undefined}
          >
            <GridIcon />
            Dashboard
          </Link>
          <Link
            href="/vendor/orders/new"
            className={`nav-item ${active === "create" ? "active" : ""}`}
            aria-current={active === "create" ? "page" : undefined}
          >
            <PlusIcon />
            Create Delivery
          </Link>
          <Link
            href="/vendor/riders"
            className={`nav-item ${active === "riders" ? "active" : ""}`}
            aria-current={active === "riders" ? "page" : undefined}
          >
            <BikeIcon />
            Riders
          </Link>
          <Link
            href="/vendor/settings"
            className={`nav-item ${active === "settings" ? "active" : ""}`}
            aria-current={active === "settings" ? "page" : undefined}
          >
            <GearIcon />
            Settings
          </Link>
          <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <LogoutButton className="nav-item" style={{ color: "var(--ink-faint)" }} showIcon />
          </div>
        </nav>

        <div className="app-main">
          <header className="app-topbar">
            <Link href="/vendor" className="app-topbar-brand items-center gap-2 font-bold text-ink">
              <LogoMark size={18} />
              Before You Dispatch
            </Link>
            <Breadcrumbs
              items={trail(active, title)}
              className="app-topbar-title"
              style={{ margin: 0 }}
            />
            <Link
              href="/vendor/orders/new"
              className="btn btn-primary"
              style={{ minHeight: 38, padding: "0 16px", fontSize: 13 }}
            >
              + New Order
            </Link>
          </header>
          <main className="content vendor">{children}</main>
        </div>
      </div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M6 17l4-8h4l4 8M10 9h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.13.36.4.66.75.82.35.16.6.46.85.82" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
