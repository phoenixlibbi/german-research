import Link from "next/link";
import { signUp } from "@/app/(auth)/actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-sm">
      <div className="text-lg font-semibold">Create account</div>
      <div className="mt-1 text-sm text-slate-300">
        You&apos;ll use this account to save your university research and
        checklists.
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <form action={signUp} className="mt-6 space-y-4">
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
            minLength={8}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-indigo-500/40 focus:ring-2"
            placeholder="At least 8 characters"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 font-semibold text-white hover:bg-indigo-500"
        >
          Create account
        </button>
      </form>

      <div className="mt-6 text-sm text-slate-300">
        Already have an account?{" "}
        <Link className="font-medium" href="/signin">
          Sign in
        </Link>
        .
      </div>
    </div>
  );
}

