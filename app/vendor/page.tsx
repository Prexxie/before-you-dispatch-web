import Link from "next/link";
import VendorShell from "@/components/VendorShell";

// Stand-in until the dashboard (design: "Vendor: Dashboard") is built later
// this week.
export default function VendorPage() {
  return (
    <VendorShell>
      <p className="eyebrow">Dashboard</p>
      <h1 className="h1">Your deliveries</h1>
      <p className="sub">
        The live dashboard is coming later this week. For now, create a
        delivery to get a link for your customer.
      </p>
      <Link href="/vendor/orders/new" className="btn btn-primary">
        + New Order
      </Link>
    </VendorShell>
  );
}
