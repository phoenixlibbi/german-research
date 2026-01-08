import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import crypto from "crypto";
import type { Workspace } from "@/lib/workspace/types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");

function nowIso() {
  return new Date().toISOString();
}

export function randomId() {
  return crypto.randomUUID();
}

export async function ensureDataDirs() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

export async function loadWorkspace(): Promise<Workspace> {
  await ensureDataDirs();

  try {
    const raw = await readFile(WORKSPACE_FILE, "utf8");
    return JSON.parse(raw) as Workspace;
  } catch {
    const empty: Workspace = {
      version: 1,
      universities: [],
      programs: [],
      admissionWindows: [],
      documentTemplates: [
        {
          id: randomId(),
          name: "Passport",
          category: "Identity",
          requiredByDefault: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "Transcripts",
          category: "Academic",
          requiredByDefault: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "Degree Certificate",
          category: "Academic",
          requiredByDefault: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "IELTS / Language Proof",
          category: "Language",
          requiredByDefault: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "CV",
          category: "Application",
          requiredByDefault: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "Statement of Purpose (SOP)",
          category: "Application",
          requiredByDefault: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "Letters of Recommendation (LORs)",
          category: "Application",
          requiredByDefault: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "APS Certificate (if applicable)",
          category: "Portal",
          requiredByDefault: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        {
          id: randomId(),
          name: "VPD / uni-assist (if required)",
          category: "Portal",
          requiredByDefault: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      ],
      applications: [],
      applicationDocuments: [],
      uploads: [],
    };

    await saveWorkspace(empty);
    return empty;
  }
}

export async function saveWorkspace(ws: Workspace) {
  await ensureDataDirs();
  await writeFile(WORKSPACE_FILE, JSON.stringify(ws, null, 2), "utf8");
}

export function getUploadsDir() {
  return UPLOADS_DIR;
}

