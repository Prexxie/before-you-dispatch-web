import type { Metadata } from "next";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "Dashboard · Before You Dispatch" };

export default function VendorPage() {
  return <Dashboard />;
}
