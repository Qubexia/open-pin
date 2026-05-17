"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { HouseholdGender, HouseholdMember } from "@/lib/stores";

const HOUSEHOLD_COLORS = [
  "#22c55e",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#a855f7",
  "#3b82f6",
  "#ef4444",
  "#eab308",
];

type HouseholdSettingsProps = {
  enabled: boolean;
  members: HouseholdMember[];
  onToggle: (value: boolean) => void;
  onMembersChange: (members: HouseholdMember[]) => void;
};

type MemberDraft = {
  name: string;
  initials: string;
  color: string;
  gender: HouseholdGender;
};

const EMPTY_DRAFT: MemberDraft = {
  name: "",
  initials: "",
  color: HOUSEHOLD_COLORS[0],
  gender: "male",
};

export function HouseholdSettings({
  enabled,
  members,
  onToggle,
  onMembersChange,
}: HouseholdSettingsProps) {
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const closeModal = () => {
    setEditingMember(null);
    setIsAdding(false);
  };

  const handleSaveMember = (draft: MemberDraft) => {
    if (editingMember) {
      onMembersChange(
        members.map((member) =>
          member.id === editingMember.id
            ? {
                ...member,
                name: draft.name,
                initials: draft.initials,
                color: draft.color,
                gender: draft.gender,
              }
            : member
        )
      );
      closeModal();
      return;
    }

    const nextMember: HouseholdMember = {
      id: `member-${Date.now()}`,
      name: draft.name,
      initials: draft.initials,
      color: draft.color,
      gender: draft.gender,
      primary: false,
    };
    onMembersChange([...members, nextMember]);
    closeModal();
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Household</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Track up to two people in one app while keeping inventory shared.
        </p>
      </div>

      <div className="ui-card overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/8 text-lg text-[var(--accent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_12%,transparent)]">
            HM
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">Household Mode</p>
            <p className="text-sm text-[var(--muted)]">Track multiple people in one app</p>
          </div>
          <span className="text-xl leading-none text-[var(--muted)]">›</span>
        </div>
        <div className="h-px bg-[color-mix(in_srgb,var(--accent)_28%,var(--border))]" />
        <div className="space-y-5 px-4 py-4 sm:px-5">
          <p className="max-w-[42ch] text-sm leading-7 text-[var(--muted)]">
            Track multiple people in a single app. When Household Mode is on, protocols and dose logs are tagged per
            person so you can filter by person later while inventory stays shared.
          </p>

          <div className="flex items-center justify-between gap-4 rounded-[calc(var(--radius-card)-0.15rem)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Enable Household Mode</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{enabled ? "On" : "Off"}</p>
            </div>
            <button
              type="button"
              onClick={() => onToggle(!enabled)}
              aria-pressed={enabled}
              className={`relative h-9 w-16 rounded-full border transition-all ${
                enabled
                  ? "border-[var(--accent)]/60 bg-[color-mix(in_srgb,var(--accent)_26%,var(--surface))] shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <span
                className={`absolute top-1 h-7 w-7 rounded-full border border-black/35 bg-[var(--foreground)] shadow-[0_5px_14px_rgba(0,0,0,0.35)] transition-all ${
                  enabled ? "left-8 bg-[var(--foreground)]" : "left-1 bg-[var(--foreground)]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {enabled && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">People</h3>
          </div>

          <div className="ui-card space-y-4 p-4 sm:p-5">
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-[calc(var(--radius-card)-0.2rem)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-semibold">{member.name}</p>
                        {member.primary && (
                          <span className="rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        {member.color} · {member.gender === "male" ? "Male body map" : "Female body map"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMember(member)}
                    className="ui-button-primary px-3 py-2 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAdding(true)}
              disabled={members.length >= 2}
              className="ui-button-primary w-full px-3 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45"
            >
              {members.length >= 2 ? "Household is full" : "+ Add Person"}
            </button>

            <p className="text-center text-xs text-[var(--muted)]">
              Max 2 people. For more, each person can install their own app.
            </p>
          </div>
        </div>
      )}

      {(isAdding || editingMember) && (
        <PersonEditorModal
          key={editingMember?.id ?? "new-person"}
          title={editingMember ? "Edit Person" : "Add Person"}
          initialMember={editingMember}
          onClose={closeModal}
          onSave={handleSaveMember}
        />
      )}
    </section>
  );
}

function PersonEditorModal({
  title,
  initialMember,
  onClose,
  onSave,
}: {
  title: string;
  initialMember: HouseholdMember | null;
  onClose: () => void;
  onSave: (draft: MemberDraft) => void;
}) {
  const [draft, setDraft] = useState<MemberDraft>(() =>
    initialMember
      ? {
          name: initialMember.name,
          initials: initialMember.initials,
          color: initialMember.color,
          gender: initialMember.gender,
        }
      : { ...EMPTY_DRAFT }
  );

  const normalizedInitials = draft.initials
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase();
  const canSave = draft.name.trim().length > 0 && normalizedInitials.length >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-[2px]">
      <div className="ui-modal-shell w-full max-w-md overflow-hidden border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_94%,transparent),color-mix(in_srgb,var(--surface-2)_96%,transparent))] shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_30px_color-mix(in_srgb,var(--accent)_18%,transparent)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        </div>

        <div className="space-y-5 px-5 py-5">
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Wife"
              className="ui-input bg-[var(--surface)]"
            />
          </Field>

          <Field label="Initial (1-2 letters)">
            <input
              value={draft.initials}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  initials: event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase(),
                }))
              }
              placeholder="M"
              className="ui-input w-24 bg-[var(--surface)] text-center text-2xl font-semibold"
            />
          </Field>

          <Field label="Color">
            <div className="flex flex-wrap gap-3">
              {HOUSEHOLD_COLORS.map((color) => {
                const active = draft.color === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, color }))}
                    className={`relative h-11 w-11 rounded-full transition-transform hover:scale-105 ${
                      active ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  >
                    {active && (
                      <span className="absolute inset-[4px] rounded-full border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Gender (for body map)">
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((gender) => {
                const active = draft.gender === gender;
                return (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, gender }))}
                    className={`rounded-[var(--radius-control)] border px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "border-[var(--accent)]/60 bg-[var(--accent)]/12 text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    {gender === "male" ? "Male" : "Female"}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-control)] border border-[var(--danger)]/60 bg-[var(--danger)]/10 px-3 py-3 text-sm font-medium text-[var(--danger)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                ...draft,
                name: draft.name.trim(),
                initials: normalizedInitials,
              })
            }
            disabled={!canSave}
            className="ui-button-primary px-3 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}
