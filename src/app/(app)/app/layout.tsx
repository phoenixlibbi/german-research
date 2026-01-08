import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { AppShell } from "@/components/app/AppShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  return (
    <AppShell
      userEmail={user.email ?? null}
      headerRight={
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"
          >
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </AppShell>
  );
}

