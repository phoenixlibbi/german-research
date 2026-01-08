import { AppShell } from "@/components/app/AppShell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell
      userEmail={null}
      headerRight={null}
    >
      {children}
    </AppShell>
  );
}

