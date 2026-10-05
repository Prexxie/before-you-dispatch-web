import type { Metadata } from "next";
import RidersPage from "./RidersPage";
import ThemeScope from "@/components/ThemeScope";

export const metadata: Metadata = { title: "Riders · WakaRoute" };

export default function VendorRidersPage() {
  return (
    <ThemeScope>
      <RidersPage />
    </ThemeScope>
  );
}
