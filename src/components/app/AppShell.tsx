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
    <div className="min-h-dvh bg-white">
      <div className="flex w-full gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <div className="text-sm font-black tracking-tight text-black">
                Germany Uni Tracker
              </div>
              <div className="mt-1 text-xs text-black/60">
                {userEmail ?? "Local workspace"}
              </div>
            </div>
            <AppNav />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <details className="group">
                    <summary className="cursor-pointer list-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/5">
                      Menu
                    </summary>
                    <div className="mt-2 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
                      <div className="mb-3">
                        <div className="text-sm font-black tracking-tight text-black">
                          Germany Uni Tracker
                        </div>
                        <div className="mt-1 text-xs text-black/60">
                          {userEmail ?? "Local workspace"}
                        </div>
                      </div>
                      <AppNav />
                    </div>
                  </details>
                </div>

                <div className="hidden lg:block">
                  <div className="text-sm font-black tracking-tight text-black">
                    Germany Uni Tracker
                  </div>
                  <div className="text-xs text-black/60">
                    {userEmail ?? "Local workspace"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">{headerRight}</div>
            </div>
          </header>

          <main className="pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

