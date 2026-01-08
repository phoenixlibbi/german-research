"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace/client";
import type { Target } from "@/lib/workspace/types";

function nowIso() {
  return new Date().toISOString();
}

export function TargetsClient() {
  const { workspace, loading, saving, error, save } = useWorkspace();
  const [editing, setEditing] = useState<Target | null>(null);
  const [creating, setCreating] = useState(false);

  const targets = useMemo(() => {
    const list = workspace?.targets ?? [];
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [workspace?.targets]);

  if (loading || !workspace) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
        Loading…
      </div>
    );
  }

  const ws = workspace;

  function startCreate() {
    setCreating(true);
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      type: "string",
      value: "",
      notes: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  function startEdit(t: Target) {
    setCreating(false);
    setEditing({ ...t });
  }

  async function upsert(nextT: Target) {
    const exists = ws.targets.some((t) => t.id === nextT.id);
    const next = {
      ...ws,
      targets: exists
        ? ws.targets.map((t) => (t.id === nextT.id ? nextT : t))
        : [...ws.targets, nextT],
    };
    await save(next);
  }

  async function remove(id: string) {
    const next = { ...ws, targets: ws.targets.filter((t) => t.id !== id) };
    await save(next);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const type = String(form.get("type") ?? "string") as Target["type"];
    const value = String(form.get("value") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();

    if (!title) return;
    await upsert({
      ...editing,
      title,
      type,
      value,
      notes: notes || undefined,
      updatedAt: nowIso(),
    });
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Targets</div>
            <div className="mt-2 text-sm text-slate-300">
              Track your goals (IELTS target band, APS deadline, application goal count, etc).
            </div>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Add target
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
        {targets.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">No targets yet.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {targets.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {t.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    type: {t.type} • value:{" "}
                    <span className="font-medium text-slate-200">{t.value || "—"}</span>
                    {t.notes ? ` • ${t.notes}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => startEdit(t)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                >
                  Update
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void remove(t.id)}
                  className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-950/50 disabled:opacity-60"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="text-lg font-semibold">
            {creating ? "Add target" : "Update target"}
          </div>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <div className="text-sm font-medium text-slate-200">Title</div>
                <input
                  name="title"
                  defaultValue={editing.title}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-slate-200">Type</div>
                <select
                  name="type"
                  defaultValue={editing.type}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="boolean">boolean</option>
                </select>
              </label>

              <label className="block">
                <div className="text-sm font-medium text-slate-200">Value</div>
                <input
                  name="value"
                  defaultValue={editing.value}
                  placeholder="e.g. 7.0"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
                />
              </label>
            </div>

            <label className="block">
              <div className="text-sm font-medium text-slate-200">Notes</div>
              <textarea
                name="notes"
                defaultValue={editing.notes ?? ""}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

