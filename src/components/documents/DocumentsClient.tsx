"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace/client";
import type { DocumentTemplate } from "@/lib/workspace/types";

type UploadedDoc = {
  id: string;
  displayName: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentsClient() {
  const { workspace, loading: wsLoading, saving, error: wsError, save } = useWorkspace();
  const [items, setItems] = useState<UploadedDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [editing, setEditing] = useState<UploadedDoc | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");

  async function refresh() {
    const res = await fetch("/api/uploads", { cache: "no-store" });
    const data = (await res.json()) as UploadedDoc[];
    setItems(data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const totalSize = useMemo(
    () => items.reduce((acc, i) => acc + (i.size ?? 0), 0),
    [items],
  );

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Please choose a file first.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Upload failed");
      }
      (e.currentTarget.elements.namedItem("file") as HTMLInputElement).value =
        "";
      setNotes("");
      setDisplayName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/uploads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Delete failed");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdateMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/uploads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          displayName,
          notes,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Update failed");
      }
      setEditing(null);
      setNotes("");
      setDisplayName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Uploaded documents</div>
            <div className="mt-2 text-sm text-black/70">
              Files are saved locally in <span className="font-medium">data/uploads/</span>{" "}
              and are ignored by git (not pushed to GitHub).
            </div>
          </div>
          <div className="text-sm text-black/70">
            {items.length} files • {formatBytes(totalSize)}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
            <span className="font-semibold">Error:</span> {error}
          </div>
        ) : null}

        <form onSubmit={onUpload} className="mt-5 flex flex-col gap-3">
          <input
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Document name (optional) — e.g. 'Passport Scan', 'Transcript Sem 1-8'"
            className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
          />
          <input
            name="file"
            type="file"
            className="block w-full text-sm text-black file:mr-4 file:rounded-xl file:border file:border-black/20 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/5"
          />
          <input
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional) — e.g. 'Original transcript PDF'"
            className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-black px-3 py-2.5 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60"
          >
            {busy ? "Working..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-black/70">No uploads yet.</div>
        ) : (
          <ul className="divide-y divide-black/10">
            {items.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-black">
                    {doc.displayName || doc.originalName}
                  </div>
                  <div className="mt-1 text-xs text-black/60">
                    {new Date(doc.createdAt).toLocaleString()} •{" "}
                    {formatBytes(doc.size)}
                    {doc.notes ? ` • ${doc.notes}` : ""}
                    {doc.displayName && doc.displayName !== doc.originalName
                      ? ` • file: ${doc.originalName}`
                      : ""}
                  </div>
                </div>
                <a
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
                  href={`/api/uploads/${encodeURIComponent(doc.id)}`}
                >
                  Download
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditing(doc);
                    setDisplayName(doc.displayName ?? "");
                    setNotes(doc.notes ?? "");
                  }}
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-60"
                >
                  Update
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDelete(doc.id)}
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
          <div className="text-lg font-semibold">Update document</div>
          <div className="mt-2 text-sm text-black/70">
            Update display name / notes (the file stays the same).
          </div>

          <form onSubmit={onUpdateMeta} className="mt-4 space-y-3">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Document name"
              className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setDisplayName("");
                  setNotes("");
                }}
                className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {workspace ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-xl font-semibold">Document templates</div>
          <div className="mt-2 text-sm text-black/70">
            Manage the list of documents that appear in the university form. Users can mark which documents are required for each university.
          </div>

          {wsError ? (
            <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
              <span className="font-semibold">Error:</span> {wsError}
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {workspace.documentTemplates.map((t) => {
              const isCollected = workspace.collectedDocumentIds?.includes(t.id) ?? false;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-black/10 p-3"
                  style={{
                    backgroundColor: isCollected ? "#000000" : "#ffffff",
                    color: isCollected ? "#ffffff" : "#000000",
                  }}
                >
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      const currentIds = workspace.collectedDocumentIds ?? [];
                      const nextIds = isCollected
                        ? currentIds.filter((id) => id !== t.id)
                        : [...currentIds, t.id];
                      const next = {
                        ...workspace,
                        collectedDocumentIds: nextIds,
                      };
                      void save(next);
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-medium">{t.name}</div>
                    {t.category ? (
                      <div className="text-xs opacity-70">{t.category}</div>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      const next = {
                        ...workspace,
                        documentTemplates: workspace.documentTemplates.filter(
                          (d) => d.id !== t.id
                        ),
                        collectedDocumentIds: (workspace.collectedDocumentIds ?? []).filter(
                          (id) => id !== t.id
                        ),
                      };
                      void save(next);
                    }}
                    className="ml-3 rounded-xl border border-current px-3 py-2 text-sm font-semibold opacity-70 hover:opacity-100 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>

          {editingTemplate ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!templateName.trim() || !workspace) return;
                const next: DocumentTemplate = {
                  id: editingTemplate.id,
                  name: templateName.trim(),
                  category: templateCategory.trim() || undefined,
                  requiredByDefault: false,
                  createdAt: editingTemplate.createdAt,
                  updatedAt: new Date().toISOString(),
                };
                const exists = workspace.documentTemplates.some(
                  (d) => d.id === next.id
                );
                const nextWs = {
                  ...workspace,
                  documentTemplates: exists
                    ? workspace.documentTemplates.map((d) =>
                        d.id === next.id ? next : d
                      )
                    : [...workspace.documentTemplates, next],
                };
                void save(nextWs);
                setEditingTemplate(null);
                setTemplateName("");
                setTemplateCategory("");
              }}
              className="mt-4 space-y-3 rounded-lg border border-black/10 bg-white p-4"
            >
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Document name (e.g. Passport, Transcripts)"
                required
                className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
              />
              <input
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                placeholder="Category (optional, e.g. Identity, Academic)"
                className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateName("");
                    setTemplateCategory("");
                  }}
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingTemplate({
                  id: crypto.randomUUID(),
                  name: "",
                  category: "",
                  requiredByDefault: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setTemplateName("");
                setTemplateCategory("");
              }}
              className="mt-4 rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
            >
              Add document template
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

