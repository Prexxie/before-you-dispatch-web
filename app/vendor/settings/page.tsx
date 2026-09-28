import type { Metadata } from "next";
import SettingsPage from "./SettingsPage";

export const metadata: Metadata = { title: "Settings · Before You Dispatch" };

export default function VendorSettingsPage() {
  return <SettingsPage />;
}
