import type { Metadata } from "next";
import RidersPage from "./RidersPage";

export const metadata: Metadata = { title: "Riders · WakaRoute" };

export default function VendorRidersPage() {
  return <RidersPage />;
}
