import type { Metadata } from "next";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "Dashboard · WakaRoute" };

export default function VendorPage() {
  return <Dashboard />;
}
