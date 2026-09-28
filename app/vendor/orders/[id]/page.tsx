import type { Metadata } from "next";
import VendorShell from "@/components/VendorShell";
import OrderView from "./OrderView";

export const metadata: Metadata = { title: "Order · Before You Dispatch" };

export default async function OrderPage({
  params,
}: PageProps<"/vendor/orders/[id]">) {
  const { id } = await params;
  return (
    <VendorShell>
      <OrderView id={id} />
    </VendorShell>
  );
}
