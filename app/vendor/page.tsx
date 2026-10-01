import type { Metadata } from "next";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "Dashboard · WakaRoute" };

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  // Straight from logging in: keep the login's welcome loader up.
  const { welcome } = await searchParams;
  return <Dashboard welcome={welcome === "1"} />;
}
