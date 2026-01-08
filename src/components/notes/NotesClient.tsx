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
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Notes</div>
            <div className="mt-2 text-sm text-black/70">
              Keep research notes, links, and reminders.
            </div>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            Add note
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
            <span className="font-semibold">Error:</span> {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
        {notes.length === 0 ? (
          <div className="p-4 text-sm text-black/70">No notes yet.</div>
        ) : (
          <ul className="divide-y divide-black/10">
            {notes.map((n) => (
              <li key={n.id} className="flex flex-wrap items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-black">
                    {n.title}
                  </div>
                  <div className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-black/70">
                    {n.body}
                  </div>
                  <div className="mt-2 text-xs text-black/60">
                    Updated {new Date(n.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => startEdit(n)}
                    className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-60"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void remove(n.id)}
                    className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-60"
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
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">
            {creating ? "Add note" : "Update note"}
          </div>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-black">Title</div>
              <input
                name="title"
                defaultValue={editing.title}
                required
                className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-black">Body</div>
              <textarea
                name="body"
                defaultValue={editing.body}
                rows={8}
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

