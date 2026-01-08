"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/workspace/client";
import type { University, UniversityFieldDefinition } from "@/lib/workspace/types";

function nowIso() {
  return new Date().toISOString();
}

function parseNumberOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function UniversitiesClient() {
  const { workspace, loading, saving, error, save } = useWorkspace();
  const [editing, setEditing] = useState<University | null>(null);
  const [creating, setCreating] = useState(false);

  const uniFields = workspace?.admin.universityFields ?? [];

  const universities = useMemo(() => {
    const list = workspace?.universities ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace?.universities]);

  if (loading || !workspace) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
        Loading…
      </div>
    );
  }

  const ws = workspace;

  async function upsertUniversity(nextUni: University) {
    const exists = ws.universities.some((u) => u.id === nextUni.id);
    const next = {
      ...ws,
      universities: exists
        ? ws.universities.map((u) => (u.id === nextUni.id ? nextUni : u))
        : [...ws.universities, nextUni],
    };
    await save(next);
  }

  async function deleteUniversity(id: string) {
    const next = {
      ...ws,
      universities: ws.universities.filter((u) => u.id !== id),
      // Also remove programs/admission windows linked to this university
      programs: ws.programs.filter((p) => p.universityId !== id),
      admissionWindows: ws.admissionWindows.filter((aw) => {
        const prog = ws.programs.find((p) => p.id === aw.programId);
        return prog ? prog.universityId !== id : true;
      }),
    };
    await save(next);
  }

  function startCreate() {
    setCreating(true);
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      city: "",
      website: "",
      degreeTitle: "",
      durationSemesters: undefined,
      requiredDocumentIds: [],
      notes: "",
      fields: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  function startEdit(u: University) {
    setCreating(false);
    setEditing({ ...u, fields: { ...(u.fields ?? {}) } });
  }

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;

    const city = String(form.get("city") ?? "").trim();
    const website = String(form.get("website") ?? "").trim();
    const degreeTitle = String(form.get("degreeTitle") ?? "").trim();
    const durationSemesters = parseNumberOrNull(String(form.get("durationSemesters") ?? ""));
    const notes = String(form.get("notes") ?? "").trim();

    // Collect checked document IDs
    const checkedDocs: string[] = [];
    for (const [key, value] of form.entries()) {
      if (key.startsWith("doc:") && value === "on") {
        checkedDocs.push(key.replace("doc:", ""));
      }
    }

    const fields: University["fields"] = {};
    for (const def of uniFields) {
      const raw = form.get(`field:${def.key}`);
      if (def.type === "boolean") {
        fields[def.key] = raw === "on";
      } else if (def.type === "number") {
        fields[def.key] = parseNumberOrNull(String(raw ?? ""));
      } else {
        const v = String(raw ?? "").trim();
        fields[def.key] = v ? v : null;
      }
    }

    await upsertUniversity({
      ...editing,
      name,
      city: city || undefined,
      website: website || undefined,
      degreeTitle: degreeTitle || undefined,
      durationSemesters: durationSemesters || undefined,
      requiredDocumentIds: checkedDocs,
      notes: notes || undefined,
      fields,
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
            <div className="text-xl font-semibold">Universities</div>
            <div className="mt-2 text-sm text-black/70">
              Table view + add/update universities. Custom fields come from{" "}
              <span className="font-medium">Admin</span>.
            </div>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            Add university
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
            <span className="font-semibold">Error:</span> {error}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-black/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {universities.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-black/70" colSpan={5}>
                    No universities yet. Click “Add university”.
                  </td>
                </tr>
              ) : (
                universities.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5">
                    <td className="px-4 py-3 font-semibold text-black">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-black/70">{u.city ?? ""}</td>
                    <td className="px-4 py-3 text-black/70">
                      {u.website ? (
                        <a href={u.website} target="_blank" rel="noreferrer">
                          {u.website}
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-4 py-3 text-black/60">
                      {new Date(u.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void deleteUniversity(u.id)}
                          className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">
            {creating ? "Add university" : "Update university"}
          </div>

          <form onSubmit={submitForm} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="text-sm font-medium text-black">Name</div>
                <input
                  name="name"
                  defaultValue={editing.name}
                  required
                  className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-black">City</div>
                <input
                  name="city"
                  defaultValue={editing.city ?? ""}
                  className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="text-sm font-medium text-black">Website</div>
                <input
                  name="website"
                  type="url"
                  defaultValue={editing.website ?? ""}
                  placeholder="https://…"
                  className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-black">Degree title</div>
                <input
                  name="degreeTitle"
                  defaultValue={editing.degreeTitle ?? ""}
                  placeholder="e.g. Master of Science in Computer Science"
                  className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-black">Duration (semesters)</div>
                <input
                  name="durationSemesters"
                  type="number"
                  min="1"
                  defaultValue={editing.durationSemesters ?? ""}
                  placeholder="e.g. 4"
                  className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
                />
              </label>
            </div>

            {ws.documentTemplates.length > 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-sm font-semibold text-black">
                  Required documents
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {ws.documentTemplates.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-2 rounded-xl border border-black/20 bg-white px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        name={`doc:${doc.id}`}
                        defaultChecked={editing.requiredDocumentIds?.includes(doc.id) ?? false}
                        className="h-4 w-4 accent-black"
                      />
                      <span className="text-sm text-black">{doc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {uniFields.length ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-sm font-semibold text-black">
                  Custom fields
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {uniFields.map((def) => (
                    <CustomFieldInput
                      key={def.id}
                      def={def}
                      defaultValue={editing.fields?.[def.key] ?? null}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <label className="block">
              <div className="text-sm font-medium text-black">Notes</div>
              <textarea
                name="notes"
                defaultValue={editing.notes ?? ""}
                rows={3}
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

function CustomFieldInput({
  def,
  defaultValue,
}: {
  def: UniversityFieldDefinition;
  defaultValue: string | number | boolean | null;
}) {
  if (def.type === "boolean") {
    return (
      <label className="flex items-center gap-2 rounded-xl border border-black/20 bg-white px-3 py-2">
        <input
          name={`field:${def.key}`}
          type="checkbox"
          defaultChecked={Boolean(defaultValue)}
          className="h-4 w-4 accent-black"
        />
        <span className="text-sm text-black">{def.label}</span>
      </label>
    );
  }

  if (def.type === "number") {
    return (
      <label className="block">
        <div className="text-sm font-medium text-black">{def.label}</div>
        <input
          name={`field:${def.key}`}
          type="number"
          defaultValue={typeof defaultValue === "number" ? defaultValue : ""}
          className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
        />
      </label>
    );
  }

  if (def.type === "date") {
    return (
      <label className="block">
        <div className="text-sm font-medium text-black">{def.label}</div>
        <input
          name={`field:${def.key}`}
          type="date"
          defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
          className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
        />
      </label>
    );
  }

  if (def.type === "text") {
    return (
      <label className="block md:col-span-2">
        <div className="text-sm font-medium text-black">{def.label}</div>
        <textarea
          name={`field:${def.key}`}
          defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
          rows={3}
          className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
        />
      </label>
    );
  }

  return (
    <label className="block">
      <div className="text-sm font-medium text-black">{def.label}</div>
      <input
        name={`field:${def.key}`}
        type={def.type === "url" ? "url" : "text"}
        defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
        className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
      />
    </label>
  );
}

