export default async function RiderPage({
  params,
}: PageProps<"/rider/[token]">) {
  const { token } = await params;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold">Your delivery</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Placeholder: pin, landmark note, and outcome buttons for link {token}.
      </p>
    </main>
  );
}
