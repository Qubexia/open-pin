"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSettings } from "@/lib/stores";

export function TabBar() {
  const pathname = usePathname();
  const {
    showInventory,
    showProtocols,
    showCalc,
  } = useAppSettings();


  const allTabs = [
    { href: "/home", label: "Home", icon: "⌂", show: true },
    { href: "/inventory", label: "Inventory", icon: "▣", show: showInventory },
    { href: "/protocols", label: "Protocols", icon: "▤", show: showProtocols },
    { href: "/calc", label: "Calc", icon: "▦", show: showCalc },
    { href: "/more", label: "More", icon: "⋯", show: true },
  ];

  const visibleTabs = allTabs.filter(t => t.show);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul
        className="mx-auto max-w-2xl grid"
        style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
      >
        {visibleTabs.map((t) => {
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
