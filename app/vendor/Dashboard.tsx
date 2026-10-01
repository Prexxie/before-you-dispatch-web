"use client";

import LogoLoader from "@/components/LogoLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  OrderList,
  OrderStatus,
  VENDOR_CATEGORY_LABELS,
  VendorInfo,
  getMe,
  getOrders,
} from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { statusBadge } from "@/lib/statusBadge";
import { formatDayTime } from "@/lib/time";
import { WELCOME_LOADING, WELCOME_TITLE } from "@/lib/brand";
import { initials } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { LogoMark } from "@/components/icons";

const firstName = (name: string) => name.trim().split(/\s+/)[0];

type Filter = "all" | OrderStatus;

// Design: "Vendor: Dashboard". Every order (not just today's — see the
// "Recent orders" scope decision, 29 Sep), refreshing every 15 seconds.
export default function Dashboard({ welcome = false }: { welcome?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const key = `${filter}-${page}`;
  // Drop ?welcome=1 from the address straight away (the flag is already
  // read), so a later reload shows the normal loader.
  useEffect(() => {
    if (welcome && window.location.search.includes("welcome=1")) {
      window.history.replaceState(null, "", "/vendor");
    }
  }, [welcome]);
  const [state] = useLiveData(
    () => getOrders({ status: filter === "all" ? undefined : filter, page }),
    key,
  );
  const data = state.kind === "ready" ? state.data : null;
  const [meState] = useLiveData(() => getMe(), "dashboard-me");
  const category = meState.kind === "ready" ? meState.data?.category : null;
  const themeColor = meState.kind === "ready" ? meState.data?.themeColor : undefined;

  function changeFilter(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  return (
    <AppShell
      active="dashboard"
      title="Dashboard"
      businessName={data?.vendorName ?? null}
      businessCategory={category ? VENDOR_CATEGORY_LABELS[category] : null}
      themeColor={themeColor}
    >
      {state.kind !== "loading" && <BusinessHeader vendor={data?.vendor ?? null} />}
      {state.kind === "loading" &&
        (welcome ? (
          <LogoLoader page cover title={WELCOME_TITLE} label={WELCOME_LOADING} />
        ) : (
          <LogoLoader label="Loading orders…" page />
        ))}
      {state.kind === "error" && (
        <p className="sub" role="alert">
          We couldn&apos;t load your orders. Check your connection. This page
          will keep trying.
        </p>
      )}
      {data && (
        <Board
          data={data}
          filter={filter}
          onFilterChange={changeFilter}
          page={page}
          onPageChange={setPage}
        />
      )}
    </AppShell>
  );
}

// Business name with its address (design: "Vendor: Dashboard"); today's date
// when the address isn't set. The phone and the "orders today" count were
// removed at the user's request (the stat tiles already show today's count).
function BusinessHeader({ vendor }: { vendor: VendorInfo | null }) {
  const date = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Lagos",
  });
  const contact = vendor?.address ?? "";
  return (
    <div className="biz-header">
      <div className="biz-logo" aria-hidden="true">
        {vendor?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data
          // URL stored on the vendor, not a servable static asset.
          <img src={vendor.logoUrl} alt="" />
        ) : vendor ? (
          initials(vendor.name)
        ) : (
          <LogoMark size={22} />
        )}
      </div>
      <div>
        <h1 className="h1" style={{ marginBottom: 2 }}>
          {vendor?.name ?? "Your deliveries"}
        </h1>
        <p className="sub" style={{ margin: 0 }}>
          {contact || <>Today &middot; {date}</>}
        </p>
      </div>
    </div>
  );
}

// One entry per real order status (not the finer badge sub-states), with
// the all-time count already on hand from the API.
function filters(counts: OrderList["counts"]): { value: Filter; label: string; count: number }[] {
  return [
    { value: "all", label: "All", count: counts.total },
    { value: "pending_confirmation", label: "Awaiting confirmation", count: counts.awaitingConfirmation },
    { value: "confirmed", label: "Confirmed", count: counts.confirmed },
    { value: "dispatched", label: "Dispatched", count: counts.outForDelivery },
    { value: "delivered", label: "Delivered", count: counts.delivered },
    { value: "failed", label: "Failed", count: counts.failed },
    { value: "not_ready", label: "Declined", count: counts.notReady },
  ];
}

function Board({
  data,
  filter,
  onFilterChange,
  page,
  onPageChange,
}: {
  data: OrderList;
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  page: number;
  onPageChange: (p: number) => void;
}) {
  const router = useRouter();
  const { today, counts, orders, totalPages } = data;

  return (
    <>
      <div className="stat-row">
        <Stat value={today.total} label="Orders today" />
        <Stat value={today.awaitingConfirmation} label="Awaiting confirmation" accent />
        <Stat value={today.outForDelivery} label="Out for delivery" />
        <Stat value={today.delivered} label="Delivered today" />
      </div>

      <p className="eyebrow">Live</p>
      <h2 className="h2" style={{ marginBottom: 16 }}>
        Recent orders
      </h2>

      {counts.total === 0 ? (
        <div className="card">
          <p className="sub" style={{ marginBottom: 18 }}>
            No orders yet. Create one and we&apos;ll give you a link for the
            customer to confirm they&apos;re ready.
          </p>
          <Link href="/vendor/orders/new" className="btn btn-primary">
            + New Order
          </Link>
        </div>
      ) : (
        <>
          <div className="filter-row" role="group" aria-label="Filter by status">
            {filters(counts).map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => onFilterChange(f.value)}
                aria-pressed={filter === f.value}
                className={`filter-chip ${filter === f.value ? "active" : ""}`}
                data-status={f.value}
              >
                {f.value !== "all" && <span className="filter-dot" aria-hidden="true" />}
                {f.label}
                <span className="filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="card">
              <p className="sub" style={{ marginBottom: 18 }}>
                No orders match this filter.
              </p>
              <button type="button" onClick={() => onFilterChange("all")} className="btn btn-secondary">
                Show all orders
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: "8px 28px" }}>
              <div className="table-scroll">
                <table className="wire">
                  <thead>
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col">Item</th>
                      <th scope="col">Rider</th>
                      <th scope="col">Status</th>
                      <th scope="col">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const badge = statusBadge(o);
                      const href = `/vendor/orders/${o.id}`;
                      return (
                        <tr key={o.id} onClick={() => router.push(href)}>
                          <td>
                            {/* The row is clickable; this link is the keyboard
                                and screen-reader way in. */}
                            <Link href={href} className="row-link" onClick={(e) => e.stopPropagation()}>
                              <span className="avatar">{initials(o.customerName)}</span>
                              {o.customerName}
                            </Link>
                          </td>
                          <td>{o.itemDescription}</td>
                          <td>{firstName(o.riderName)}</td>
                          <td>
                            <span className={`badge whitespace-nowrap ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap tabular-nums">{formatDayTime(o.updatedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div
      className="row-flex"
      style={{ padding: "14px 0", justifyContent: "space-between", alignItems: "center" }}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn btn-secondary"
        style={{ minHeight: 38, padding: "0 16px", fontSize: 13, flex: "none" }}
      >
        Previous
      </button>
      <span className="text-[13px] font-semibold text-ink-soft">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn btn-secondary"
        style={{ minHeight: 38, padding: "0 16px", fontSize: 13, flex: "none" }}
      >
        Next
      </button>
    </div>
  );
}

function Stat({ value, label, accent = false }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="stat-tile">
      <div className={`stat-num ${accent ? "accent" : ""}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
