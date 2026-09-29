import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Set a new password · WakaRoute" };

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
