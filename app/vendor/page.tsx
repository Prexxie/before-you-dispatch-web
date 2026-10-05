import type { Metadata } from "next";
import Dashboard from "./Dashboard";
import ThemeScope from "@/components/ThemeScope";

export const metadata: Metadata = { title: "Dashboard · WakaRoute" };

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  // Straight from logging in: keep the login's welcome loader up.
  const { welcome } = await searchParams;
  return (
    <ThemeScope>
      <Dashboard welcome={welcome === "1"} />
    </ThemeScope>
  );
}
