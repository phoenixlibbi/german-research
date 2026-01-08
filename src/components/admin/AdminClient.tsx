"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace/client";
import type { FieldType, UniversityFieldDefinition } from "@/lib/workspace/types";

function slugKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
}

export function AdminClient() {
  const { workspace, loading, saving, error, save } = useWorkspace();
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState<FieldType>("string");

  const fields = workspace?.admin.universityFields ?? [];
  const startKey = workspace?.admin.calendar.startFieldKey ?? null;
  const endKey = workspace?.admin.calendar.endFieldKey ?? null;

  const keySuggestion = useMemo(() => slugKey(label), [label]);

  if (loading || !workspace) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
        Loading…
      </div>
    );
  }

  const ws = workspace;

  async function addField() {
    const finalLabel = label.trim();
    const finalKey = (key.trim() || keySuggestion).trim();
    if (!finalLabel || !finalKey) return;

    const nextField: UniversityFieldDefinition = {
      id: crypto.randomUUID(),
      label: finalLabel,
      key: finalKey,
      type,
    };

    const next = {
      ...ws,
      admin: {
        ...ws.admin,
        universityFields: [...ws.admin.universityFields, nextField],
      },
    };
    await save(next);
    setLabel("");
    setKey("");
    setType("string");
  }

  async function removeField(id: string) {
    const nextFields = ws.admin.universityFields.filter((f) => f.id !== id);
    const removed = ws.admin.universityFields.find((f) => f.id === id);
    const removedKey = removed?.key ?? null;

    const next = {
      ...ws,
      admin: {
        ...ws.admin,
        universityFields: nextFields,
        calendar: {
          startFieldKey:
            removedKey && ws.admin.calendar.startFieldKey === removedKey
              ? null
              : ws.admin.calendar.startFieldKey,
          endFieldKey:
            removedKey && ws.admin.calendar.endFieldKey === removedKey
              ? null
              : ws.admin.calendar.endFieldKey,
        },
      },
    };
    await save(next);
  }

  async function setCalendarMapping(nextStart: string | null, nextEnd: string | null) {
    const next = {
      ...ws,
      admin: {
        ...ws.admin,
        calendar: {
          startFieldKey: nextStart,
          endFieldKey: nextEnd,
        },
      },
    };
    await save(next);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="text-xl font-semibold">Admin</div>
        <div className="mt-2 text-sm text-slate-300">
          Define custom fields you want to track per university (IELTS, VPD, degree duration,
          admission dates, etc). These fields will appear in the University add/edit form.
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-sm font-medium text-slate-200">Label</div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. IELTS overall"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-slate-200">Key</div>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={keySuggestion || "e.g. ielts_overall"}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            />
            <div className="mt-1 text-xs text-slate-400">
              Stored in JSON. Use letters/numbers/underscore.
            </div>
          </label>

          <label className="block">
            <div className="text-sm font-medium text-slate-200">Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            >
              <option value="string">string</option>
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="date">date</option>
              <option value="boolean">boolean</option>
              <option value="url">url</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          disabled={saving || !label.trim()}
          onClick={() => void addField()}
          className="mt-4 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add field"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="text-lg font-semibold">Calendar mapping</div>
        <div className="mt-2 text-sm text-slate-300">
          Choose which university fields represent <span className="font-medium">start</span> and{" "}
          <span className="font-medium">end</span> dates for the calendar page.
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium text-slate-200">Start date field</div>
            <select
              value={startKey ?? ""}
              onChange={(e) =>
                void setCalendarMapping(e.target.value || null, endKey)
              }
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            >
              <option value="">(none)</option>
              {fields
                .filter((f) => f.type === "date")
                .map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label} ({f.key})
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm font-medium text-slate-200">End date field</div>
            <select
              value={endKey ?? ""}
              onChange={(e) =>
                void setCalendarMapping(startKey, e.target.value || null)
              }
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            >
              <option value="">(none)</option>
              {fields
                .filter((f) => f.type === "date")
                .map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label} ({f.key})
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
        {fields.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">No custom fields yet.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {fields.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {f.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    key: <span className="font-medium">{f.key}</span> • type:{" "}
                    <span className="font-medium">{f.type}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void removeField(f.id)}
                  className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-950/50 disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

