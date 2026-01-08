import { NextResponse } from "next/server";
import { loadWorkspace, saveWorkspace } from "@/lib/workspace/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ws = await loadWorkspace();
  return NextResponse.json(ws);
}

export async function POST(request: Request) {
  const ws = await request.json();
  await saveWorkspace(ws);
  return NextResponse.json({ ok: true });
}

