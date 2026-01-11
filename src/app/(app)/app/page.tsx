"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/workspace/client";
import { useMemo } from "react";

function parseYmdToMs(v: unknown): number | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const ms = Date.parse(`${v.trim()}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

type UniPeriodStatus =
  | "no_dates"
  | "open_now"
  | "opening_soon"
  | "closing_soon"
  | "upcoming"
  | "past";

function classifyPeriod(
  startMs: number | null,
  endMs: number | null,
  nowMs: number,
): UniPeriodStatus {
  if (startMs === null && endMs === null) return "no_dates";
  const soonMs = 14 * 86400000;
  if (startMs !== null && endMs !== null) {
    if (nowMs >= startMs && nowMs <= endMs) {
      if (endMs - nowMs <= soonMs) return "closing_soon";
      return "open_now";
    }
    if (startMs > nowMs) {
      if (startMs - nowMs <= soonMs) return "opening_soon";
      return "upcoming";
    }
    return "past";
  }
  if (startMs !== null) {
    if (startMs > nowMs) {
      if (startMs - nowMs <= soonMs) return "opening_soon";
      return "upcoming";
    }
    return "past";
  }
  if (endMs !== null) {
    if (nowMs <= endMs) {
      if (endMs - nowMs <= soonMs) return "closing_soon";
      return "open_now";
    }
    return "past";
  }
  return "no_dates";
}

export default function DashboardPage() {
  const { workspace, loading } = useWorkspace();

  const targets = useMemo(() => {
    if (!workspace) return [];
    return [...(workspace.targets ?? [])]
      .filter((t) => t.targetDate)
      .sort((a, b) => {
        const aDate = a.targetDate ? new Date(a.targetDate).getTime() : 0;
        const bDate = b.targetDate ? new Date(b.targetDate).getTime() : 0;
        return aDate - bDate;
      })
      .slice(0, 5);
  }, [workspace]);

  const focus = useMemo(() => {
    if (!workspace) {
      return {
        total: 0,
        open_now: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
        opening_soon: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
        closing_soon: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
        upcoming: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
        no_dates: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
      };
    }

    const nowMs = Date.now();
    const startKey = workspace.admin.calendar.startFieldKey ?? "admission_start";
    const endKey = workspace.admin.calendar.endFieldKey ?? "admission_end";

    const buckets = {
      total: workspace.universities.length,
      open_now: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
      opening_soon: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
      closing_soon: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
      upcoming: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
      no_dates: [] as { id: string; name: string; city?: string; start?: string; end?: string }[],
    };

    for (const u of workspace.universities) {
      const start = typeof u.fields?.[startKey] === "string" ? (u.fields[startKey] as string) : "";
      const end = typeof u.fields?.[endKey] === "string" ? (u.fields[endKey] as string) : "";
      const startMs = parseYmdToMs(start);
      const endMs = parseYmdToMs(end);
      const status = classifyPeriod(startMs, endMs, nowMs);
      const item = { id: u.id, name: u.name, city: u.city, start: start || undefined, end: end || undefined };
      if (status === "open_now") buckets.open_now.push(item);
      else if (status === "opening_soon") buckets.opening_soon.push(item);
      else if (status === "closing_soon") buckets.closing_soon.push(item);
      else if (status === "upcoming") buckets.upcoming.push(item);
      else if (status === "no_dates") buckets.no_dates.push(item);
    }

    // Keep lists small + predictable ordering
    const bySoonest = (a: any, b: any) =>
      String(a.end ?? a.start ?? "").localeCompare(String(b.end ?? b.start ?? ""));
    buckets.open_now.sort(bySoonest);
    buckets.opening_soon.sort(bySoonest);
    buckets.closing_soon.sort(bySoonest);
    buckets.upcoming.sort(bySoonest);
    buckets.no_dates.sort((a, b) => a.name.localeCompare(b.name));

    buckets.open_now = buckets.open_now.slice(0, 6);
    buckets.opening_soon = buckets.opening_soon.slice(0, 6);
    buckets.closing_soon = buckets.closing_soon.slice(0, 6);
    buckets.upcoming = buckets.upcoming.slice(0, 6);
    buckets.no_dates = buckets.no_dates.slice(0, 6);

    return buckets;
  }, [workspace]);

  if (loading || !workspace) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold">Dashboard</div>
        <div className="mt-2 text-sm text-black/70">
          This will show your upcoming deadlines, missing documents, and active
          applications.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
            href="/app/universities"
          >
            Add uni
          </Link>
          <Link
            className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
            href="/app/documents"
          >
            Set up document checklist
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-black">Focus (application periods)</div>
            <div className="mt-2 text-sm text-black/70">
              Based on your mapped start/end fields in Admin.
            </div>
          </div>
          <Link
            href="/app/universities"
            className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
          >
            Open universities →
          </Link>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          {[
            { key: "open_now", title: "Open now", items: focus.open_now },
            { key: "closing_soon", title: "Closing soon", items: focus.closing_soon },
            { key: "opening_soon", title: "Opening soon", items: focus.opening_soon },
            { key: "upcoming", title: "Upcoming", items: focus.upcoming },
            { key: "no_dates", title: "Missing dates", items: focus.no_dates },
          ].map((b) => (
            <div key={b.key} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-black">{b.title}</div>
                <div className="text-xs text-black/60">{b.items.length}</div>
              </div>
              <div className="mt-3 space-y-2">
                {b.items.length === 0 ? (
                  <div className="text-sm text-black/60">—</div>
                ) : (
                  b.items.map((u) => (
                    <div key={u.id} className="rounded-lg border border-black/10 bg-white p-2">
                      <div className="text-sm font-medium text-black">{u.name}</div>
                      <div className="text-xs text-black/60">
                        {u.city ?? "—"}
                        {u.start || u.end ? (
                          <>
                            {" "}
                            • {u.start ?? "—"} → {u.end ?? "—"}
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-black">
            Upcoming targets
          </div>
          <div className="mt-3 space-y-2">
            {targets.length === 0 ? (
              <div className="text-sm text-black/70">No targets with dates yet.</div>
            ) : (
              targets.map((t) => (
                <div key={t.id} className="rounded-lg border border-black/10 bg-white p-3">
                  <div className="text-sm font-medium text-black">{t.name}</div>
                  {t.description ? (
                    <div className="mt-1 text-xs text-black/60">{t.description}</div>
                  ) : null}
                  {t.targetDate ? (
                    <div className="mt-1 text-xs text-black/60">
                      Target: {new Date(t.targetDate).toLocaleDateString()}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
          {targets.length > 0 ? (
            <Link
              href="/app/targets"
              className="mt-3 block text-xs text-black/70 hover:text-black underline"
            >
              View all targets →
            </Link>
          ) : null}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-black">
            Document templates
          </div>
          <div className="mt-3 space-y-2">
            {workspace.documentTemplates.length === 0 ? (
              <div className="text-sm text-black/70">
                No document templates yet. Add them in{" "}
                <Link href="/app/documents" className="underline hover:text-black">
                  Documents
                </Link>
                .
              </div>
            ) : (
              <>
                {workspace.documentTemplates.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-lg border border-black/10 bg-white p-2"
                  >
                    <div className="text-sm text-black">{doc.name}</div>
                    {doc.category ? (
                      <div className="text-xs text-black/60">{doc.category}</div>
                    ) : null}
                  </div>
                ))}
                {workspace.documentTemplates.length > 5 ? (
                  <div className="text-xs text-black/60">
                    +{workspace.documentTemplates.length - 5} more
                  </div>
                ) : null}
                <Link
                  href="/app/documents"
                  className="mt-2 block text-xs text-black/70 hover:text-black underline"
                >
                  Manage all documents →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

