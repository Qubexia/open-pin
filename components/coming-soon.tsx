"use client";

import Link from "next/link";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-block text-xs rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)]">
        ← Back to More
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-3xl mb-2">🚧</p>
        <p className="font-medium">Coming soon</p>
        <p className="text-sm text-[var(--muted)] mt-2 max-w-md mx-auto">{description}</p>
      </div>
    </div>
  );
}
