"use client";

import Link from "next/link";
import { useState } from "react";
import { PRACTICES, TABS, type PracticeSection } from "@/data/best-practices";

export function InfoScreen() {
  const [tab, setTab] = useState<PracticeSection["category"]>("practice");
  const [open, setOpen] = useState<string | null>(null);

  const list = PRACTICES.filter((p) => p.category === tab);

  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-block text-xs rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)]">
        ← Back to More
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Info & Best Practices</h1>
        <p className="text-sm text-[var(--muted)]">Educational content · not medical advice</p>
      </div>

      <div className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3">
        <p className="text-xs text-[var(--warning)]">
          ⚠ Educational and research purposes only. Not medical advice. Always consult a licensed healthcare provider.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setOpen(null); }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--muted)]">{list.length} section{list.length !== 1 ? "s" : ""}</p>

      <ul className="space-y-2">
        {list.map((p) => {
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : p.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="font-medium">{p.title}</span>
                <span className="text-[var(--muted)] text-xs">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-2 text-sm text-[var(--muted)]">
                  {p.body.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
