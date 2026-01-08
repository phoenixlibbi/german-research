"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useWorkspace } from "@/lib/workspace/client";

type CalEvent = {
  id: string;
  uniId: string;
  title: string;
  date: Date;
  kind: "start" | "end";
};

function parseDateOrNull(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  try {
    const d = parseISO(v);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function CalendarClient() {
  const { workspace, loading, error } = useWorkspace();
  const [cursor, setCursor] = useState(() => new Date());

  const events = useMemo<CalEvent[]>(() => {
    if (!workspace) return [];
    const startKey = workspace.admin.calendar.startFieldKey;
    const endKey = workspace.admin.calendar.endFieldKey;
    if (!startKey && !endKey) return [];

    const out: CalEvent[] = [];
    for (const u of workspace.universities) {
      if (startKey) {
        const d = parseDateOrNull(u.fields?.[startKey]);
        if (d) {
          out.push({
            id: `${u.id}:start`,
            uniId: u.id,
            title: `${u.name} — start`,
            date: d,
            kind: "start",
          });
        }
      }
      if (endKey) {
        const d = parseDateOrNull(u.fields?.[endKey]);
        if (d) {
          out.push({
            id: `${u.id}:end`,
            uniId: u.id,
            title: `${u.name} — end`,
            date: d,
            kind: "end",
          });
        }
      }
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [workspace]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = new Date(d.getTime() + 86400000)) {
    days.push(d);
  }

  if (loading || !workspace) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
        Loading…
      </div>
    );
  }

  const startMapped = workspace.admin.calendar.startFieldKey;
  const endMapped = workspace.admin.calendar.endFieldKey;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Calendar</div>
            <div className="mt-2 text-sm text-black/70">
              Shows all universities’ start/end dates based on Admin mapping.
              {startMapped || endMapped ? (
                <>
                  {" "}
                  Current mapping:{" "}
                  <span className="font-medium">{startMapped ?? "—"}</span> /{" "}
                  <span className="font-medium">{endMapped ?? "—"}</span>
                </>
              ) : (
                <>
                  {" "}
                  Set mapping in <span className="font-medium">Admin</span>.
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCursor((d) => addMonths(d, -1))}
              className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCursor((d) => addMonths(d, 1))}
              className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
            >
              Next
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-black/20 bg-black/5 px-3 py-2 text-sm text-black">
            <span className="font-semibold">Error:</span> {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-black">
          {format(cursor, "MMMM yyyy")}
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs text-black/60">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-1 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            const dayEvents = events.filter((e) => isSameDay(e.date, day));

            return (
              <div
                key={day.toISOString()}
                className={[
                  "min-h-24 rounded-xl border p-2",
                  inMonth ? "border-black/10 bg-white" : "border-black/10 bg-white",
                  isToday ? "ring-2 ring-black/20" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className={inMonth ? "text-black" : "text-black/40"}>
                    {format(day, "d")}
                  </div>
                  {dayEvents.length ? (
                    <div className="text-[10px] text-black/60">
                      {dayEvents.length}
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={[
                        "truncate rounded-lg px-2 py-1 text-[11px] font-medium",
                        e.kind === "start"
                          ? "bg-black/5 text-black border border-black/10"
                          : "bg-black/10 text-black border border-black/20",
                      ].join(" ")}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 ? (
                    <div className="text-[11px] text-black/60">
                      +{dayEvents.length - 3} more
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-black">All dates</div>
        <div className="mt-2 text-sm text-black/70">
          Tip: add your universities’ dates in the Universities “Custom fields” section.
        </div>

        {events.length === 0 ? (
          <div className="mt-4 text-sm text-black/70">
            No start/end dates found yet.
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-black/10">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0 flex-1 truncate text-sm text-black">
                  {e.title}
                </div>
                <div className="text-sm text-black/70">
                  {format(e.date, "yyyy-MM-dd")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

