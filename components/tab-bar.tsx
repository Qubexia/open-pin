"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "Home", icon: "⌂" },
  { href: "/inventory", label: "Inventory", icon: "▣" },
  { href: "/protocols", label: "Protocols", icon: "▤" },
  { href: "/calc", label: "Calc", icon: "▦" },
  { href: "/more", label: "More", icon: "⋯" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-5">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs ${
                  active ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-foreground"
                }`}
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
