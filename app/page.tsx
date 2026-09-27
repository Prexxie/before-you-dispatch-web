import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">Before You Dispatch</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Customers confirm they&apos;re ready and share exactly where to find
        them, before a rider is sent out.
      </p>
      <Link href="/vendor" className="font-medium underline">
        Go to the vendor dashboard
      </Link>
    </main>
  );
}
