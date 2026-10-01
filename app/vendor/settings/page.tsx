import type { Metadata } from "next";
import SettingsPage from "./SettingsPage";

export const metadata: Metadata = { title: "Settings · WakaRoute" };

export default function VendorSettingsPage() {
  return <SettingsPage />;
}
