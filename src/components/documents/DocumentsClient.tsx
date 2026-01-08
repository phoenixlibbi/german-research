"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/lib/workspace/client";
import type { DocumentTemplate } from "@/lib/workspace/types";

type UploadedDoc = {
  id: string;
  templateId?: string;
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
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/uploads", { cache: "no-store" });
    const data = (await res.json()) as UploadedDoc[];
    setItems(data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function getUploadForTemplate(templateId: string): UploadedDoc | undefined {
    return items.find((item) => item.templateId === templateId);
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>, templateId: string) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Please choose a file first.");
      return;
    }

    setBusy(templateId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateId", templateId);
      const displayName = form.get("displayName");
      if (displayName) formData.append("displayName", String(displayName));
      const notes = form.get("notes");
      if (notes) formData.append("notes", String(notes));

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Upload failed");
      }
      (e.currentTarget.elements.namedItem("file") as HTMLInputElement).value = "";
      (e.currentTarget.elements.namedItem("displayName") as HTMLInputElement).value = "";
      (e.currentTarget.elements.namedItem("notes") as HTMLInputElement).value = "";
      setUploadingFor(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function onDeleteUpload(id: string) {
    setError(null);
    setBusy(id);
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
      setBusy(null);
    }
  }

  if (wsLoading || !workspace) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold">Document templates</div>
        <div className="mt-2 text-sm text-black/70">
          Manage documents and upload files for each template. Click a document to mark as collected (black background).
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
            <span className="font-semibold">Error:</span> {error}
          </div>
        ) : null}

        {wsError ? (
          <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
            <span className="font-semibold">Error:</span> {wsError}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {workspace.documentTemplates.map((t) => {
            const isCollected = workspace.collectedDocumentIds?.includes(t.id) ?? false;
            const uploaded = getUploadForTemplate(t.id);
            const isUploading = uploadingFor === t.id;
            const isBusy = busy === t.id;

            return (
              <div
                key={t.id}
                className="rounded-lg border border-black/10 p-4"
                style={{
                  backgroundColor: isCollected ? "#000000" : "#ffffff",
                  color: isCollected ? "#ffffff" : "#000000",
                }}
              >
                <div className="flex items-start justify-between gap-3">
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
                      <div className="text-xs opacity-70 mt-1">{t.category}</div>
                    ) : null}
                    {uploaded ? (
                      <div className="text-xs opacity-70 mt-1">
                        {formatBytes(uploaded.size)} • {new Date(uploaded.createdAt).toLocaleDateString()}
                      </div>
                    ) : null}
                  </button>

                  <div className="flex items-center gap-2">
                    {uploaded ? (
                      <>
                        <a
                          href={`/api/uploads/${encodeURIComponent(uploaded.id)}`}
                          className="rounded-xl border border-current px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100"
                          style={{
                            borderColor: isCollected ? "#ffffff" : "#000000",
                            color: isCollected ? "#ffffff" : "#000000",
                          }}
                        >
                          View
                        </a>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void onDeleteUpload(uploaded.id)}
                          className="rounded-xl border border-current px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100 disabled:opacity-40"
                          style={{
                            borderColor: isCollected ? "#ffffff" : "#000000",
                            color: isCollected ? "#ffffff" : "#000000",
                          }}
                        >
                          {isBusy ? "..." : "Delete file"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUploadingFor(isUploading ? null : t.id)}
                        className="rounded-xl border border-current px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100"
                        style={{
                          borderColor: isCollected ? "#ffffff" : "#000000",
                          color: isCollected ? "#ffffff" : "#000000",
                        }}
                      >
                        {isUploading ? "Cancel" : "Upload"}
                      </button>
                    )}
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
                        // Also delete uploaded file if exists
                        if (uploaded) {
                          void onDeleteUpload(uploaded.id);
                        }
                        void save(next);
                      }}
                      className="rounded-xl border border-current px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100 disabled:opacity-40"
                      style={{
                        borderColor: isCollected ? "#ffffff" : "#000000",
                        color: isCollected ? "#ffffff" : "#000000",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isUploading && !uploaded ? (
                  <form
                    onSubmit={(e) => void onUpload(e, t.id)}
                    className="mt-3 space-y-2 rounded-lg border border-current/30 p-3"
                    style={{
                      borderColor: isCollected ? "#ffffff" : "#000000",
                    }}
                  >
                    <input
                      name="displayName"
                      placeholder="Document name (optional)"
                      className="w-full rounded-xl border border-current/30 bg-transparent px-3 py-2 text-xs outline-none placeholder:opacity-50 focus:ring-2 focus:ring-current/30"
                      style={{
                        borderColor: isCollected ? "#ffffff" : "#000000",
                        color: isCollected ? "#ffffff" : "#000000",
                      }}
                    />
                    <input
                      name="file"
                      type="file"
                      required
                      className="block w-full text-xs file:mr-2 file:rounded-xl file:border file:border-current/30 file:bg-transparent file:px-2 file:py-1 file:text-xs file:font-semibold file:opacity-70 hover:file:opacity-100"
                      style={{
                        color: isCollected ? "#ffffff" : "#000000",
                      }}
                    />
                    <input
                      name="notes"
                      placeholder="Notes (optional)"
                      className="w-full rounded-xl border border-current/30 bg-transparent px-3 py-2 text-xs outline-none placeholder:opacity-50 focus:ring-2 focus:ring-current/30"
                      style={{
                        borderColor: isCollected ? "#ffffff" : "#000000",
                        color: isCollected ? "#ffffff" : "#000000",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="rounded-xl border border-current bg-transparent px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100 disabled:opacity-40"
                        style={{
                          borderColor: isCollected ? "#ffffff" : "#000000",
                          color: isCollected ? "#ffffff" : "#000000",
                        }}
                      >
                        {isBusy ? "Uploading..." : "Upload"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadingFor(null)}
                        className="rounded-xl border border-current/30 bg-transparent px-3 py-2 text-xs font-semibold opacity-70 hover:opacity-100"
                        style={{
                          borderColor: isCollected ? "#ffffff" : "#000000",
                          color: isCollected ? "#ffffff" : "#000000",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
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
    </div>
  );
}
