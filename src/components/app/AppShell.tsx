import { AppNav } from "@/components/app/AppNav";

export function AppShell({
  children,
  userEmail,
  headerRight,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-4">
              <div className="text-sm font-semibold text-indigo-200">
                Germany Uni Tracker
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {userEmail ?? "Signed in"}
              </div>
            </div>
            <AppNav />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <div className="text-sm font-semibold text-indigo-200">
                Germany Uni Tracker
              </div>
              <div className="text-xs text-slate-400">{userEmail ?? ""}</div>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">{headerRight}</div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}

