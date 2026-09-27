import ConfirmFlow from "./ConfirmFlow";

export default async function ConfirmPage({
  params,
}: PageProps<"/confirm/[token]">) {
  const { token } = await params;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <ConfirmFlow token={token} />
    </main>
  );
}
