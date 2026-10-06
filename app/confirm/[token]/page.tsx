import type { Metadata } from "next";
import ConfirmFlow from "./ConfirmFlow";

export const metadata: Metadata = {
  title: "Your delivery · WakaRoute",
  // The URL is the credential: keep it out of search results and Referer headers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ConfirmPage({
  params,
}: PageProps<"/confirm/[token]">) {
  const { token } = await params;
  return <ConfirmFlow token={token} />;
}
