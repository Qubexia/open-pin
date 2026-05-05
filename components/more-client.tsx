"use client";

import Link from "next/link";

const ITEMS = [
  { href: "/more/interactions", label: "Interactions", icon: "⚡", desc: "Pair matrix & organ load" },
  { href: "/more/mix", label: "Mix", icon: "💉", desc: "Compatibility grid" },
  { href: "/more/library", label: "Library", icon: "📚", desc: "All 263 compounds" },
  { href: "/more/info", label: "Info", icon: "ℹ️", desc: "Best practices & guides" },
  { href: "/more/insights", label: "Insights", icon: "✨", desc: "AI-powered weekly reports" },
  { href: "/more/labs", label: "Labs", icon: "🩸", desc: "Bloodwork tracking" },
  { href: "/more/pill-bin", label: "Pill Bin", icon: "💊", desc: "Weekly pill organizer" },
  { href: "/more/settings", label: "Settings", icon: "⚙", desc: "API keys & data export" },
];

export function MoreScreen() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">More</h1>

      <ul className="space-y-2">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5"
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-[var(--muted)] truncate">{item.desc}</p>
              </div>
              <span className="text-[var(--muted)]">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
