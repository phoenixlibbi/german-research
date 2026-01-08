import { NextResponse } from "next/server";
import path from "path";
import { unlink, writeFile } from "fs/promises";
import {
  getUploadsDir,
  loadWorkspace,
  randomId,
  saveWorkspace,
} from "@/lib/workspace/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ws = await loadWorkspace();
  return NextResponse.json(ws.uploads);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const displayName = String(form.get("displayName") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim() || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file (field name must be 'file')." },
      { status: 400 },
    );
  }

  const id = randomId();
  const uploadsDir = getUploadsDir();
  const safeOriginalName = file.name.replaceAll(/[^\w.\- ()]/g, "_");
  const storedName = `${id}-${safeOriginalName}`;
  const storedPath = path.join(uploadsDir, storedName);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath, buf);

  const ws = await loadWorkspace();
  const now = new Date().toISOString();
  ws.uploads.unshift({
    id,
    displayName: displayName || file.name,
    originalName: file.name,
    storedName,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    createdAt: now,
    updatedAt: now,
    notes,
  });
  await saveWorkspace(ws);

  return NextResponse.json({ ok: true, id });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    displayName?: string;
    notes?: string | null;
  };

  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ws = await loadWorkspace();
  const idx = ws.uploads.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = ws.uploads[idx];
  ws.uploads[idx] = {
    ...existing,
    displayName:
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim()
        : existing.displayName,
    notes:
      body.notes === null
        ? undefined
        : typeof body.notes === "string"
          ? body.notes.trim() || undefined
          : existing.notes,
    updatedAt: new Date().toISOString(),
  };

  await saveWorkspace(ws);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ws = await loadWorkspace();
  const doc = ws.uploads.find((u) => u.id === id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  ws.uploads = ws.uploads.filter((u) => u.id !== id);
  await saveWorkspace(ws);

  try {
    const storedPath = path.join(getUploadsDir(), doc.storedName);
    await unlink(storedPath);
  } catch {
    // If it's already deleted, that's fine.
  }

  return NextResponse.json({ ok: true });
}

