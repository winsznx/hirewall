import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 px-4 py-24 sm:px-6">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Not found</p>
      <h1 className="text-xl font-semibold tracking-tight text-ink">This page or record doesn&rsquo;t exist.</h1>
      <p className="text-[13px] text-ink-muted">
        Check the link, or start a new dispatch from the workspace.
      </p>
      <Link href="/dispatch" className="mt-2 text-[13px] font-medium text-accent hover:underline">
        Go to dispatch workspace →
      </Link>
    </div>
  );
}
