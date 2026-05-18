"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TabBar } from "@/components/tab-bar";
import { OWNER_FIXED_PIN, verifyPin } from "@/lib/pin";
import { useAppSettings, useHouseholdSession, type AppSettings, type HouseholdMember } from "@/lib/stores";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    loaded: settingsLoaded,
    hydrate: hydrateSettings,
    householdMode,
    householdMembers,
  } = useAppSettings();
  const { activeMemberId, loaded: sessionLoaded, hydrate, lock, unlock } = useHouseholdSession();

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    if (!settingsLoaded) return;
    const state = useAppSettings.getState();
    const nextSettings: AppSettings = {
      theme: state.theme,
      accent: state.accent,
      density: state.density,
      motion: state.motion,
      defaultLanding: state.defaultLanding,
      labsPreviewCount: state.labsPreviewCount,
      unitSystem: state.unitSystem,
      showAdherence: state.showAdherence,
      showInventory: state.showInventory,
      showProtocols: state.showProtocols,
      showLabs: state.showLabs,
      showCalc: state.showCalc,
      householdMode,
      householdMembers,
    };
    hydrate(nextSettings);
  }, [hydrate, householdMembers, householdMode, settingsLoaded]);

  const pinProtected = useMemo(
    () =>
      householdMode && householdMembers.length > 0,
    [householdMembers, householdMode]
  );

  const activeMember = householdMembers.find((member) => member.id === activeMemberId) ?? null;
  const isLocked = settingsLoaded && sessionLoaded && pinProtected && !activeMember;

  if (!settingsLoaded || !sessionLoaded) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="ui-card w-full max-w-sm px-5 py-6 text-center">
          <p className="text-sm font-medium">Loading OnePin…</p>
          <p className="mt-2 text-xs text-[var(--muted)]">Preparing your workspace and household settings.</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <PinLoginScreen
        members={householdMembers}
        onUnlock={unlock}
      />
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-20 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/home" className="text-sm font-semibold tracking-tight">
            OnePin
          </Link>

          <div className="flex items-center gap-2">
            {pinProtected && activeMember && (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 sm:flex">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: activeMember.color }}
                  >
                    {activeMember.initials}
                  </span>
                  <span className="text-xs font-medium">{activeMember.name}</span>
                </div>
                <button
                  type="button"
                  onClick={lock}
                  className="flex h-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--muted)] transition-colors hover:text-foreground"
                >
                  Lock
                </button>
              </>
            )}

            <Link
              href="/more/settings"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] hover:text-foreground"
            >
              ⚙
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-2xl px-4 pt-4 pb-24">{children}</main>
      <TabBar />
    </>
  );
}

function PinLoginScreen({
  members,
  onUnlock,
}: {
  members: HouseholdMember[];
  onUnlock: (memberId: string) => void;
}) {
  const unlockableMembers = members.filter((member) => member.primary || member.pinHash);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(unlockableMembers[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedMember = unlockableMembers.find((member) => member.id === selectedMemberId) ?? unlockableMembers[0];

  const appendDigit = (digit: string) => {
    setPin((current) => (current.length >= 6 ? current : `${current}${digit}`));
    setStatus("");
  };

  const backspace = () => {
    setPin((current) => current.slice(0, -1));
    setStatus("");
  };

  const handleUnlock = async () => {
    if (!selectedMember || pin.length !== 6) return;
    setSubmitting(true);
    const ok = selectedMember.primary
      ? pin === OWNER_FIXED_PIN
      : await verifyPin(pin, selectedMember.pinHash);
    setSubmitting(false);

    if (!ok) {
      setPin("");
      setStatus("Incorrect PIN. Try again.");
      return;
    }

    onUnlock(selectedMember.id);
    setPin("");
    setStatus("");
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <div className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Household Access</p>
          <h1 className="text-3xl font-semibold tracking-tight">Enter your 6-digit PIN</h1>
          <p className="mx-auto max-w-[34ch] text-sm leading-6 text-[var(--muted)]">
            Choose your profile, then unlock your workspace with your assigned code.
          </p>
        </div>

        <div className="ui-card overflow-hidden border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,transparent),color-mix(in_srgb,var(--surface-2)_92%,transparent))] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="space-y-5 px-5 py-5">
            <div className="grid grid-cols-2 gap-2">
              {unlockableMembers.map((member) => {
                const active = member.id === selectedMember?.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setPin("");
                      setStatus("");
                    }}
                    className={`rounded-[var(--radius-control)] border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)]/55 bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{member.name}</p>
                        <p className="text-[11px] text-[var(--muted)]">
                          {member.primary ? "Owner access" : active ? "Selected" : "Tap to choose"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[calc(var(--radius-card)-0.15rem)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">PIN</p>
                  <p className="mt-1 text-sm font-medium">{selectedMember?.name ?? "Select a profile"}</p>
                </div>
                <span className="text-xs text-[var(--muted)]">{pin.length}/6</span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                {Array.from({ length: 6 }).map((_, index) => {
                  const filled = index < pin.length;
                  return (
                    <div
                      key={index}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-lg transition-colors ${
                        filled
                          ? "border-[var(--accent)]/55 bg-[var(--accent)]/12 text-[var(--accent)]"
                          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                      }`}
                    >
                      {filled ? "•" : ""}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => void handleUnlock()}
                disabled={pin.length !== 6 || submitting || !selectedMember}
                className="ui-button-primary mt-4 w-full px-3 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting ? "Checking…" : "Unlock"}
              </button>
              {status && <p className="mt-3 text-center text-xs text-[var(--danger)]">{status}</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, index) =>
                key ? (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={key === "⌫" ? backspace : () => appendDigit(key)}
                    className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-lg font-medium transition-colors hover:border-[var(--accent)]/35 hover:text-[var(--accent)]"
                  >
                    {key}
                  </button>
                ) : (
                  <div key={`empty-${index}`} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
