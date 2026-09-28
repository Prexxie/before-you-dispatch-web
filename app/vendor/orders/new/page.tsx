import type { Metadata } from "next";
import VendorShell from "@/components/VendorShell";
import CreateOrderFlow from "./CreateOrderFlow";

export const metadata: Metadata = { title: "Create a delivery · Before You Dispatch" };

export default function NewOrderPage() {
  return (
    <VendorShell>
      <CreateOrderFlow />
    </VendorShell>
  );
}
