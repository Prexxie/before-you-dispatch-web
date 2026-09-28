import type { Metadata } from "next";
import RiderFlow from "./RiderFlow";

export const metadata: Metadata = {
  title: "Delivery · Before You Dispatch",
};

export default async function RiderPage({
  params,
}: PageProps<"/rider/[token]">) {
  const { token } = await params;
  return <RiderFlow token={token} />;
}
