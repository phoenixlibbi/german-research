"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatFee(n: number | undefined) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDateCell(v: unknown) {
  if (typeof v !== "string" || !v) return "";
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : v;
}

export function UniversitiesClient() {
  const { workspace, loading, saving, error, save } = useWorkspace();
  const [editing, setEditing] = useState<University | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<University | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const uniFields = workspace?.admin.universityFields ?? [];
  // "Documents" are handled separately via requiredDocumentIds, so we hide any doc-style custom field in the table.
  const hiddenFieldKeys = useMemo(
    () => new Set(["required_documents", "degree_duration_months"]),
    [],
  );
  const visibleUniFields = useMemo(
    () =>
      uniFields.filter(
        (d) =>
          !hiddenFieldKeys.has(d.key) &&
          !d.key.toLowerCase().includes("ielts"),
      ),
    [uniFields, hiddenFieldKeys],
  );
  const formUniFields = visibleUniFields;

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

  async function upsertUniversity(
    nextUni: University,
  ): Promise<{ ok: boolean; created: boolean }> {
    const exists = ws.universities.some((u) => u.id === nextUni.id);
    const next = {
      ...ws,
      universities: exists
        ? ws.universities.map((u) => (u.id === nextUni.id ? nextUni : u))
        : [...ws.universities, nextUni],
    };
    const ok = await save(next);
    return { ok, created: !exists };
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
    const ok = await save(next);
    if (ok && viewing?.id === id) setViewing(null);
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
      tuitionFeePerSemester: undefined,
      germanLanguageTestRequired: false,
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
    const tuitionFeePerSemester = parseNumberOrNull(String(form.get("tuitionFeePerSemester") ?? ""));
    const germanLanguageTestRequired = form.get("germanLanguageTestRequired") === "on";
    const notes = String(form.get("notes") ?? "").trim();

    // Preserve any existing hidden fields (so removing a column doesn't wipe data).
    const fields: University["fields"] = { ...(editing.fields ?? {}) };
    for (const def of formUniFields) {
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

    const res = await upsertUniversity({
      ...editing,
      name,
      city: city || undefined,
      website: website || undefined,
      degreeTitle: degreeTitle || undefined,
      durationSemesters: durationSemesters || undefined,
      tuitionFeePerSemester: tuitionFeePerSemester ?? undefined,
      germanLanguageTestRequired,
      // Required docs are managed elsewhere now; keep existing values unchanged.
      requiredDocumentIds: editing.requiredDocumentIds ?? [],
      notes: notes || undefined,
      fields,
      updatedAt: nowIso(),
    });

    if (res.ok) {
      setEditing(null);
      setCreating(false);
      setNotice(res.created ? "University added" : "University updated");
    }
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-lg">
          {notice}
        </div>
      ) : null}
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
                <th className="px-4 py-3">Degree</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">German lang</th>
                {visibleUniFields.map((def) => (
                  <th key={def.id} className="px-4 py-3">
                    {def.label}
                  </th>
                ))}
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {universities.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-black/70" colSpan={9 + visibleUniFields.length}>
                    No universities yet. Click “Add university”.
                  </td>
                </tr>
              ) : (
                universities.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5">
                    <td className="px-4 py-3 font-semibold text-black">
                      {u.website ? (
                        <a
                          href={u.website}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:no-underline"
                        >
                          {u.name}
                        </a>
                      ) : (
                        u.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-black/70">{u.city ?? ""}</td>
                    <td className="px-4 py-3 text-black/70">{u.degreeTitle ?? ""}</td>
                    <td className="px-4 py-3 text-black/70">
                      {typeof u.durationSemesters === "number" ? u.durationSemesters : ""}
                    </td>
                    <td className="px-4 py-3 text-black/70">{formatFee(u.tuitionFeePerSemester)}</td>
                    <td className="px-4 py-3 text-black/70">
                      {typeof u.germanLanguageTestRequired === "boolean"
                        ? u.germanLanguageTestRequired
                          ? "Yes"
                          : "No"
                        : ""}
                    </td>
                    {visibleUniFields.map((def) => {
                      const v = u.fields?.[def.key] ?? null;
                      const render =
                        def.type === "boolean"
                          ? v === null
                            ? ""
                            : v
                              ? "Yes"
                              : "No"
                          : def.type === "date"
                            ? formatDateCell(v)
                            : def.type === "url" && typeof v === "string" && v
                              ? v
                              : v === null
                                ? ""
                                : String(v);
                      return (
                        <td key={def.id} className="px-4 py-3 text-black/70">
                          {def.type === "url" && typeof v === "string" && v ? (
                            <a href={v} target="_blank" rel="noreferrer" className="underline">
                              {v}
                            </a>
                          ) : (
                            render
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-black/60">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-black/60">
                      {new Date(u.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewing(u)}
                          className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
                        >
                          View
                        </button>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-black/10 p-5">
              <div className="text-lg font-semibold text-black">
                {creating ? "Add university" : "Update university"}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
              >
                Close
              </button>
            </div>

            <div className="max-h-[80vh] overflow-auto p-5">
              <form onSubmit={submitForm} className="space-y-4">
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

                  <label className="block">
                    <div className="text-sm font-medium text-black">Fee (EUR / semester)</div>
                    <input
                      name="tuitionFeePerSemester"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={editing.tuitionFeePerSemester ?? ""}
                      placeholder="e.g. 1500"
                      className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-semibold text-black">Tests & language</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-xl border border-black/20 bg-white px-3 py-2">
                      <input
                        type="checkbox"
                        name="germanLanguageTestRequired"
                        defaultChecked={Boolean(editing.germanLanguageTestRequired)}
                        className="h-4 w-4 accent-black"
                      />
                      <span className="text-sm text-black">
                        German language test required
                      </span>
                    </label>
                  </div>
                </div>

                {formUniFields.length ? (
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-sm font-semibold text-black">Custom fields</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {formUniFields.map((def) => (
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
                    onClick={() => {
                      setEditing(null);
                      setCreating(false);
                    }}
                    className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {viewing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-black/10 p-5">
              <div>
                <div className="text-lg font-semibold text-black">{viewing.name}</div>
                <div className="mt-1 text-sm text-black/60">
                  {viewing.city ?? ""}{viewing.city && viewing.website ? " • " : ""}
                  {viewing.website ? (
                    <a
                      href={viewing.website}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:no-underline"
                    >
                      Website
                    </a>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-semibold text-black">Basics</div>
                  <div className="mt-3 space-y-2 text-sm text-black/80">
                    <div>
                      <span className="font-medium">Degree:</span> {viewing.degreeTitle ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium">Duration (semesters):</span>{" "}
                      {typeof viewing.durationSemesters === "number"
                        ? viewing.durationSemesters
                        : "—"}
                    </div>
                    <div>
                      <span className="font-medium">Fee:</span>{" "}
                      {formatFee(viewing.tuitionFeePerSemester) || "—"}
                    </div>
                    <div>
                      <span className="font-medium">German language test required:</span>{" "}
                      {typeof viewing.germanLanguageTestRequired === "boolean"
                        ? viewing.germanLanguageTestRequired
                          ? "Yes"
                          : "No"
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-semibold text-black">Dates & fields</div>
                  <div className="mt-3 space-y-2 text-sm text-black/80">
                    {visibleUniFields.length === 0 ? (
                      <div className="text-black/60">No custom fields.</div>
                    ) : (
                      visibleUniFields.map((def) => {
                        const v = viewing.fields?.[def.key] ?? null;
                        const text =
                          def.type === "boolean"
                            ? v === null
                              ? "—"
                              : v
                                ? "Yes"
                                : "No"
                            : def.type === "date"
                              ? formatDateCell(v) || "—"
                              : v === null
                                ? "—"
                                : String(v);
                        return (
                          <div key={def.id}>
                            <span className="font-medium">{def.label}:</span>{" "}
                            {def.type === "url" && typeof v === "string" && v ? (
                              <a
                                href={v}
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:no-underline"
                              >
                                {v}
                              </a>
                            ) : (
                              text
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {ws.documentTemplates.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-semibold text-black">Required documents</div>
                  <div className="mt-3 text-sm text-black/60">
                    Managed in Documents (not set per-university here).
                  </div>
                </div>
              ) : null}

              {viewing.notes ? (
                <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-semibold text-black">Notes</div>
                  <div className="mt-3 whitespace-pre-wrap text-sm text-black/80">
                    {viewing.notes}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
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

