import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <div className="text-xl font-semibold">Dashboard</div>
        <div className="mt-2 text-sm text-slate-300">
          This will show your upcoming deadlines, missing documents, and active
          applications.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            href="/app/universities"
          >
            Add universities
          </Link>
          <Link
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"
            href="/app/documents"
          >
            Set up document checklist
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="text-sm font-semibold text-slate-100">
            Upcoming admission windows
          </div>
          <div className="mt-2 text-sm text-slate-300">
            After we add the database, you’ll see dates here (start/end) and
            application deadlines.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="text-sm font-semibold text-slate-100">
            Missing documents
          </div>
          <div className="mt-2 text-sm text-slate-300">
            You’ll get a “what’s missing” list per university/program.
          </div>
        </div>
      </div>
    </div>
  );
}

