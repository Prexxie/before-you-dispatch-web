import type { Metadata } from "next";
import SettingsPage from "./SettingsPage";
import ThemeScope from "@/components/ThemeScope";

export const metadata: Metadata = { title: "Settings · WakaRoute" };

export default function VendorSettingsPage() {
  return (
    <ThemeScope>
      <SettingsPage />
    </ThemeScope>
  );
}
