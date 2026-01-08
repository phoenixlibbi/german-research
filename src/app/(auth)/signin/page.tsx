import Link from "next/link";
import { signIn } from "@/app/(auth)/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const success = typeof sp.success === "string" ? sp.success : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-sm">
      <div className="text-lg font-semibold">Sign in</div>
      <div className="mt-1 text-sm text-slate-300">
        Use your email and password.
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <form action={signIn} className="mt-6 space-y-4">
        <label className="block">
          <div className="text-sm font-medium text-slate-200">Email</div>
          <input
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            placeholder="you@email.com"
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-slate-200">Password</div>
          <input
            name="password"
            type="password"
            required
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 font-semibold text-white hover:bg-indigo-500"
        >
          Sign in
        </button>
      </form>

      <div className="mt-6 text-sm text-slate-300">
        Don&apos;t have an account?{" "}
        <Link className="font-medium" href="/signup">
          Create one
        </Link>
        .
      </div>
    </div>
  );
}

