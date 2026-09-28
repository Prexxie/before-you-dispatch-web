import type { Metadata } from "next";
import ConfirmFlow from "./ConfirmFlow";

export const metadata: Metadata = {
  title: "Your delivery · Before You Dispatch",
};

export default async function ConfirmPage({
  params,
}: PageProps<"/confirm/[token]">) {
  const { token } = await params;
  return <ConfirmFlow token={token} />;
}
