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
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
        Loading…
      </div>
    );
  }

  const ws = workspace;

  function startCreate() {
    setCreating(true);
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      targetDate: "",
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
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const targetDate = String(form.get("targetDate") ?? "").trim();

    if (!name) return;
    await upsert({
      ...editing,
      name,
      description: description || undefined,
      targetDate: targetDate || undefined,
      updatedAt: nowIso(),
    });
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Targets</div>
            <div className="mt-2 text-sm text-black/70">
              Track your goals (IELTS target band, APS deadline, application goal count, etc).
            </div>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            Add target
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
            <span className="font-semibold">Error:</span> {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
        {targets.length === 0 ? (
          <div className="p-4 text-sm text-black/70">No targets yet.</div>
        ) : (
          <ul className="divide-y divide-black/10">
            {targets.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-black">
                    {t.name}
                  </div>
                  <div className="mt-1 text-xs text-black/60">
                    {t.description ? `${t.description} • ` : ""}
                    {t.targetDate
                      ? `Target: ${new Date(t.targetDate).toLocaleDateString()}`
                      : "No target date"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => startEdit(t)}
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-60"
                >
                  Update
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void remove(t.id)}
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-60"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">
            {creating ? "Add target" : "Update target"}
          </div>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-black">Target name</div>
              <input
                name="name"
                defaultValue={editing.name}
                required
                placeholder="e.g. IELTS Band 7.0"
                className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-black">Description</div>
              <textarea
                name="description"
                defaultValue={editing.description ?? ""}
                rows={3}
                placeholder="Optional description or notes"
                className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-black">Target date</div>
              <input
                name="targetDate"
                type="date"
                defaultValue={editing.targetDate ?? ""}
                className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
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

