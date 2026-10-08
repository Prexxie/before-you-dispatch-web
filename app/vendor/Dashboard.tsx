"use client";

import LogoLoader from "@/components/LogoLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  FAILURE_REASON_LABELS,
  NeedsYouItem,
  OrderList,
  OrderStatus,
  categoryLabel,
  VendorInfo,
  getMe,
  getOrders,
} from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { statusBadge } from "@/lib/statusBadge";
import { formatDayTime, formatTime } from "@/lib/time";
import { WELCOME_LOADING, WELCOME_TITLE } from "@/lib/brand";
import { initials } from "@/lib/format";
import AppShell from "@/components/AppShell";
import {
  AddressPinIcon,
  HourglassIcon,
  LogoMark,
  ParcelIcon,
  PinTickIcon,
  RiderIcon,
} from "@/components/icons";

const firstName = (name: string) => name.trim().split(/\s+/)[0];

type Filter = "all" | OrderStatus;

// Design: "Vendor: Dashboard". Every order (not just today's — see the
// "Recent orders" scope decision, 29 Sep), refreshing every 15 seconds.
export default function Dashboard({ welcome = false }: { welcome?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  // Set by tapping a stat tile: the list shows only today's orders, the set
  // the tiles count. The filter chips below show all-time orders.
  const [todayOnly, setTodayOnly] = useState(false);
  const [page, setPage] = useState(1);
  const key = `${filter}-${todayOnly}-${page}`;
  // Drop ?welcome=1 from the address straight away (the flag is already
  // read), so a later reload shows the normal loader.
  useEffect(() => {
    if (welcome && window.location.search.includes("welcome=1")) {
      window.history.replaceState(null, "", "/vendor");
    }
  }, [welcome]);
  const [state] = useLiveData(
    () => getOrders({ status: filter === "all" ? undefined : filter, page, today: todayOnly }),
    key,
  );
  const data = state.kind === "ready" ? state.data : null;
  const [meState] = useLiveData(() => getMe(), "dashboard-me");
  const me = meState.kind === "ready" ? meState.data : null;
  const themeColor = meState.kind === "ready" ? meState.data?.themeColor : undefined;

  function changeFilter(next: Filter) {
    setFilter(next);
    setTodayOnly(false);
    setPage(1);
  }

  // A stat tile: list today's orders of that kind; tapping the selected
  // tile again goes back to all orders.
  function selectTile(next: Filter) {
    const again = todayOnly && filter === next;
    setFilter(again ? "all" : next);
    setTodayOnly(!again);
    setPage(1);
    if (!again) {
      document.getElementById("orders")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <AppShell
      active="dashboard"
      title="Dashboard"
      businessName={data?.vendorName ?? null}
      businessCategory={me ? categoryLabel(me) : null}
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
          todayOnly={todayOnly}
          onFilterChange={changeFilter}
          onTileSelect={selectTile}
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
          {contact ? (
            <>
              <AddressPinIcon size={20} className="addr-pin" />
              {contact}
            </>
          ) : (
            <>Today &middot; {date}</>
          )}
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
  todayOnly,
  onFilterChange,
  onTileSelect,
  page,
  onPageChange,
}: {
  data: OrderList;
  filter: Filter;
  todayOnly: boolean;
  onFilterChange: (f: Filter) => void;
  onTileSelect: (f: Filter) => void;
  page: number;
  onPageChange: (p: number) => void;
}) {
  const router = useRouter();
  const { today, counts, orders, totalPages } = data;
  const tile = (f: Filter) => ({
    selected: todayOnly && filter === f,
    onSelect: () => onTileSelect(f),
  });
  const filterLabel = filters(counts).find((f) => f.value === filter)?.label;

  return (
    <>
      <NeedsYou items={data.needsYou} total={data.needsYouTotal} />

      <div className="stat-row">
        <Stat
          value={today.total}
          label="Orders today"
          tone="orders"
          icon={<ParcelIcon size={18} />}
          {...tile("all")}
        />
        <Stat
          value={today.awaitingConfirmation}
          label="Awaiting confirmation"
          accent
          tone="waiting"
          icon={<HourglassIcon size={18} />}
          {...tile("pending_confirmation")}
        />
        <Stat
          value={today.outForDelivery}
          label="Out for delivery"
          tone="out"
          icon={<RiderIcon size={16} />}
          {...tile("dispatched")}
        />
        <Stat
          value={today.delivered}
          label="Delivered today"
          tone="done"
          icon={<PinTickIcon size={18} />}
          {...tile("delivered")}
        />
      </div>

      <p className="eyebrow">Live</p>
      <div className="orders-head" id="orders">
        <h2 className="h2" style={{ margin: 0 }}>
          {todayOnly
            ? `Today's orders${filter !== "all" && filterLabel ? ` · ${filterLabel}` : ""}`
            : "Recent orders"}
        </h2>
        {todayOnly && (
          <button type="button" className="orders-clear" onClick={() => onFilterChange("all")}>
            Show all orders
          </button>
        )}
      </div>

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

// One stat tile. `tone` colours the icon badge with the same status colours
// as the filter chips and badges below. The icon moves only while there's
// something in that state (the parcel sparkles, sand falls in the
// hourglass, the bike bobs).
function Stat({
  value,
  label,
  accent = false,
  tone,
  icon,
  selected,
  onSelect,
}: {
  value: number;
  label: string;
  accent?: boolean;
  tone: "orders" | "waiting" | "out" | "done";
  icon: ReactNode;
  // Tapping a tile lists those orders below (outlined while selected).
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`stat-tile tone-${tone}${value > 0 ? " live" : ""}${selected ? " selected" : ""}`}
    >
      <div>
        <div className={`stat-num ${accent ? "accent" : ""}`}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      <span className="stat-icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

// "Needs your attention" (design: "Vendor: Dashboard"): today's orders waiting on
// the vendor, oldest first, each with the button that opens the order at
// the step to take. Hidden when nothing is waiting.
const NEEDS_YOU: Record<
  NeedsYouItem["kind"],
  { dot: string; primary?: boolean; text: (i: NeedsYouItem) => ReactNode; action: (i: NeedsYouItem) => string }
> = {
  ready_to_send: {
    dot: "#065f46",
    primary: true,
    text: (i) => (
      <>
        <strong>{firstName(i.customerName)} is ready.</strong> Send{" "}
        {firstName(i.riderName)} the rider link
      </>
    ),
    action: (i) => `Send to ${firstName(i.riderName)}`,
  },
  rider_declined: {
    dot: "#b91c1c",
    text: (i) => (
      <>
        <strong>{firstName(i.declinedRiderName ?? i.riderName)} declined</strong>{" "}
        {firstName(i.customerName)}&apos;s delivery
      </>
    ),
    action: () => "Pick another rider",
  },
  failed: {
    dot: "#b91c1c",
    text: (i) => (
      <>
        <strong>Delivery to {firstName(i.customerName)} failed</strong>
        {i.failureReason ? `: ${FAILURE_REASON_LABELS[i.failureReason].toLowerCase()}` : ""}
      </>
    ),
    action: () => "Redeliver",
  },
  customer_declined: {
    dot: "#6b6558",
    text: (i) => <strong>{firstName(i.customerName)} said not now</strong>,
    action: () => "Ask again",
  },
};

function NeedsYou({ items, total }: { items: NeedsYouItem[]; total: number }) {
  if (total === 0) return null;
  return (
    <section className="needs" aria-labelledby="needs-title">
      <div className="needs-head">
        <h2 id="needs-title">Needs your attention</h2>
        <span className="needs-count">{total}</span>
        <span className="needs-sub">Oldest first</span>
      </div>
      {items.map((i) => {
        const kind = NEEDS_YOU[i.kind];
        return (
          <div key={i.id} className="needs-row">
            <span className="needs-dot" style={{ background: kind.dot }} aria-hidden="true" />
            <span className="needs-text">
              {kind.text(i)} &middot; #{i.orderNumber}
            </span>
            <span className="needs-when">{formatTime(i.since)}</span>
            <Link
              href={`/vendor/orders/${i.id}`}
              className={`btn ${kind.primary ? "btn-primary" : "btn-secondary"} needs-btn`}
            >
              {kind.action(i)}
            </Link>
          </div>
        );
      })}
      {total > items.length && (
        <p className="needs-more">
          And {total - items.length} more. They&apos;re in the list below.
        </p>
      )}
    </section>
  );
}
