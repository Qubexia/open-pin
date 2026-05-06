"use client";

import Link from "next/link";
import { useEffect } from "react";
import { COMPOUNDS } from "@/data/compounds";
import { useLabs, useOrals } from "@/lib/stores";

export function MoreScreen() {
  const { entries: labs, loaded: labsLoaded, load: loadLabs } = useLabs();
  const { orals, loaded: oralsLoaded, load: loadOrals } = useOrals();

  useEffect(() => {
    if (!labsLoaded) loadLabs();
    if (!oralsLoaded) loadOrals();
  }, [labsLoaded, loadLabs, oralsLoaded, loadOrals]);

  const items = [
    { href: "/more/interactions", label: "Interactions", icon: "⚡", desc: "Pair matrix & organ load" },
    { href: "/more/mix", label: "Mix", icon: "💉", desc: "Compatibility grid" },
    { href: "/more/library", label: "Library", icon: "📚", desc: `${COMPOUNDS.length} compounds in library` },
    { href: "/more/info", label: "Info", icon: "ℹ️", desc: "Best practices & guides" },
    { href: "/more/insights", label: "Insights", icon: "✨", desc: "Weekly reports from your logged data" },
    { href: "/more/labs", label: "Labs", icon: "🩸", desc: labs.length > 0 ? `${labs.length} result${labs.length === 1 ? "" : "s"} tracked` : "Bloodwork tracking" },
    { href: "/more/pill-bin", label: "Pill Bin", icon: "💊", desc: orals.length > 0 ? `${orals.length} supplement${orals.length === 1 ? "" : "s"} available` : "Weekly pill organizer" },
    { href: "/more/settings", label: "Settings", icon: "⚙", desc: "API keys & data export" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">More</h1>

      <ul className="space-y-2">
        {items.map((item) => (
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
