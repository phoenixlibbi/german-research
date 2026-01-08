import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { getUploadsDir, loadWorkspace } from "@/lib/workspace/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ws = await loadWorkspace();
  const doc = ws.uploads.find((u) => u.id === id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const storedPath = path.join(getUploadsDir(), doc.storedName);
  const buf = await readFile(storedPath);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        doc.originalName,
      )}"`,
    },
  });
}

