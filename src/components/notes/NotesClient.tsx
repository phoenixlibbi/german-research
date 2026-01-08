"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace/client";
import type { Note } from "@/lib/workspace/types";

function nowIso() {
  return new Date().toISOString();
}

export function NotesClient() {
  const { workspace, loading, saving, error, save } = useWorkspace();
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  const notes = useMemo(() => {
    const list = workspace?.notes ?? [];
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [workspace?.notes]);

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
      body: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  function startEdit(n: Note) {
    setCreating(false);
    setEditing({ ...n });
  }

  async function upsert(nextN: Note) {
    const exists = ws.notes.some((n) => n.id === nextN.id);
    const next = {
      ...ws,
      notes: exists
        ? ws.notes.map((n) => (n.id === nextN.id ? nextN : n))
        : [...ws.notes, nextN],
    };
    await save(next);
  }

  async function remove(id: string) {
    const next = { ...ws, notes: ws.notes.filter((n) => n.id !== id) };
    await save(next);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();
    if (!title) return;
    await upsert({
      ...editing,
      title,
      body,
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
            <div className="text-xl font-semibold">Notes</div>
            <div className="mt-2 text-sm text-slate-300">
              Keep research notes, links, and reminders.
            </div>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Add note
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
        {notes.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">No notes yet.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {notes.map((n) => (
              <li key={n.id} className="flex flex-wrap items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {n.title}
                  </div>
                  <div className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-slate-400">
                    {n.body}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Updated {new Date(n.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => startEdit(n)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void remove(n.id)}
                    className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-950/50 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="text-lg font-semibold">
            {creating ? "Add note" : "Update note"}
          </div>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-slate-200">Title</div>
              <input
                name="title"
                defaultValue={editing.title}
                required
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-slate-200">Body</div>
              <textarea
                name="body"
                defaultValue={editing.body}
                rows={8}
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

