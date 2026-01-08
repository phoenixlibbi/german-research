import Link from "next/link";

export default function DashboardPage() {
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
            Upcoming admission windows
          </div>
          <div className="mt-2 text-sm text-black/70">
            After we add the database, you’ll see dates here (start/end) and
            application deadlines.
          </div>
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

