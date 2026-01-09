import { NextResponse } from "next/server";
import { loadWorkspace, saveWorkspace } from "@/lib/workspace/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READ_ONLY = process.env.VERCEL === "1";

export async function GET() {
  const ws = await loadWorkspace();
  return NextResponse.json(ws, {
    headers: {
      "x-workspace-readonly": READ_ONLY ? "1" : "0",
    },
  });
}

export async function POST(request: Request) {
  if (READ_ONLY) {
    return NextResponse.json(
      { ok: false, error: "Read-only on deployed site" },
      { status: 403 },
    );
  }
  const ws = await request.json();
  await saveWorkspace(ws);
  return NextResponse.json({ ok: true });
}

