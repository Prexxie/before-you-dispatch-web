import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Sign up · WakaRoute" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  // The login page sends a brand-new Google user here with ?google=1.
  const { google } = await searchParams;
  return (
    <AuthShell>
      <SignupForm fromGoogle={google === "1"} />
    </AuthShell>
  );
}
