import type { Metadata } from "next";
import VendorShell from "@/components/VendorShell";
import EditOrderForm from "./EditOrderForm";

export const metadata: Metadata = { title: "Edit order · WakaRoute" };

export default async function EditOrderPage({
  params,
}: PageProps<"/vendor/orders/[id]/edit">) {
  const { id } = await params;
  return (
    <VendorShell>
      <EditOrderForm id={id} />
    </VendorShell>
  );
}
