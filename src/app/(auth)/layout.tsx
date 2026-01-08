export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-6">
          <div className="text-sm font-semibold text-indigo-200">
            Germany Uni Tracker
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            Research + Documents Checklist
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Track universities, admission windows, IELTS/VPD requirements, and
            your application documents (checklist only — no uploads).
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

