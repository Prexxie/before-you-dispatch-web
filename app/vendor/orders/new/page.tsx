import type { Metadata } from "next";
import VendorShell from "@/components/VendorShell";
import CreateOrderFlow from "./CreateOrderFlow";

export const metadata: Metadata = { title: "Create a delivery · WakaRoute" };

export default function NewOrderPage() {
  return (
    <VendorShell
      crumbs={[{ label: "Dashboard", href: "/vendor" }, { label: "New order" }]}
    >
      <CreateOrderFlow />
    </VendorShell>
  );
}
