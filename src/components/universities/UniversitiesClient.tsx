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
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
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
    const notes = String(form.get("notes") ?? "").trim();

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
      notes: notes || undefined,
      fields,
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
            <div className="text-xl font-semibold">Universities</div>
            <div className="mt-2 text-sm text-slate-300">
              Table view + add/update universities. Custom fields come from{" "}
              <span className="font-medium">Admin</span>.
            </div>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Add university
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {universities.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-300" colSpan={5}>
                    No universities yet. Click “Add university”.
                  </td>
                </tr>
              ) : (
                universities.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.city ?? ""}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {u.website ? (
                        <a href={u.website} target="_blank" rel="noreferrer">
                          {u.website}
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(u.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void deleteUniversity(u.id)}
                          className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-950/50 disabled:opacity-60"
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
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="text-lg font-semibold">
            {creating ? "Add university" : "Update university"}
          </div>

          <form onSubmit={submitForm} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="text-sm font-medium text-slate-200">Name</div>
                <input
                  name="name"
                  defaultValue={editing.name}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-slate-200">City</div>
                <input
                  name="city"
                  defaultValue={editing.city ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="text-sm font-medium text-slate-200">Website</div>
                <input
                  name="website"
                  type="url"
                  defaultValue={editing.website ?? ""}
                  placeholder="https://…"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
                />
              </label>
            </div>

            {uniFields.length ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-sm font-semibold text-slate-100">
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

function CustomFieldInput({
  def,
  defaultValue,
}: {
  def: UniversityFieldDefinition;
  defaultValue: string | number | boolean | null;
}) {
  if (def.type === "boolean") {
    return (
      <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
        <input
          name={`field:${def.key}`}
          type="checkbox"
          defaultChecked={Boolean(defaultValue)}
          className="h-4 w-4 accent-indigo-500"
        />
        <span className="text-sm text-slate-200">{def.label}</span>
      </label>
    );
  }

  if (def.type === "number") {
    return (
      <label className="block">
        <div className="text-sm font-medium text-slate-200">{def.label}</div>
        <input
          name={`field:${def.key}`}
          type="number"
          defaultValue={typeof defaultValue === "number" ? defaultValue : ""}
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
        />
      </label>
    );
  }

  if (def.type === "date") {
    return (
      <label className="block">
        <div className="text-sm font-medium text-slate-200">{def.label}</div>
        <input
          name={`field:${def.key}`}
          type="date"
          defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
        />
      </label>
    );
  }

  if (def.type === "text") {
    return (
      <label className="block md:col-span-2">
        <div className="text-sm font-medium text-slate-200">{def.label}</div>
        <textarea
          name={`field:${def.key}`}
          defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
          rows={3}
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
        />
      </label>
    );
  }

  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-200">{def.label}</div>
      <input
        name={`field:${def.key}`}
        type={def.type === "url" ? "url" : "text"}
        defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
      />
    </label>
  );
}

