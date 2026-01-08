"use client";

import { useEffect, useMemo, useState } from "react";

type UploadedDoc = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  notes?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentsClient() {
  const [items, setItems] = useState<UploadedDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Uploaded documents</div>
            <div className="mt-2 text-sm text-slate-300">
              Files are saved locally in <span className="font-medium">data/uploads/</span>{" "}
              and are ignored by git (not pushed to GitHub).
            </div>
          </div>
          <div className="text-sm text-slate-300">
            {items.length} files • {formatBytes(totalSize)}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={onUpload} className="mt-5 flex flex-col gap-3">
          <input
            name="file"
            type="file"
            className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-800"
          />
          <input
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional) — e.g. 'Original transcript PDF'"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Working..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">No uploads yet.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {items.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {doc.originalName}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {new Date(doc.createdAt).toLocaleString()} •{" "}
                    {formatBytes(doc.size)}
                    {doc.notes ? ` • ${doc.notes}` : ""}
                  </div>
                </div>
                <a
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"
                  href={`/api/uploads/${encodeURIComponent(doc.id)}`}
                >
                  Download
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDelete(doc.id)}
                  className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-950/50 disabled:opacity-60"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

