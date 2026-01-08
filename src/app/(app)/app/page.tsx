"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/workspace/client";
import { useMemo } from "react";

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
            Add universities
          </Link>
          <Link
            className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
            href="/app/documents"
          >
            Set up document checklist
          </Link>
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
            Missing documents
          </div>
          <div className="mt-2 text-sm text-black/70">
            You’ll get a “what’s missing” list per university/program.
          </div>
        </div>
      </div>
    </div>
  );
}

