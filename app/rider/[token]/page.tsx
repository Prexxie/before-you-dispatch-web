import type { Metadata } from "next";
import RiderFlow from "./RiderFlow";

export const metadata: Metadata = {
  title: "Delivery · WakaRoute",
  // The URL is the credential: keep it out of search results and Referer headers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function RiderPage({
  params,
}: PageProps<"/rider/[token]">) {
  const { token } = await params;
  return <RiderFlow token={token} />;
}
