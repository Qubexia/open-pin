export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p> : null}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="mt-6 text-[10px] uppercase tracking-wider text-[var(--muted)]">
      For research purposes only — not for human consumption.
    </p>
  );
}
