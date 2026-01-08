import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import crypto from "crypto";
import type { AdminSettings, Workspace } from "@/lib/workspace/types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");

function nowIso() {
  return new Date().toISOString();
}

export function randomId() {
  return crypto.randomUUID();
}

function defaultAdminSettings(): AdminSettings {
  return {
    universityFields: [
      { id: randomId(), key: "admission_start", label: "Admission start", type: "date" },
      { id: randomId(), key: "admission_end", label: "Admission end", type: "date" },
      { id: randomId(), key: "ielts_overall", label: "IELTS overall", type: "number" },
      { id: randomId(), key: "ielts_min_band", label: "IELTS min band", type: "number" },
      { id: randomId(), key: "vpd_required", label: "VPD required", type: "boolean" },
      {
        id: randomId(),
        key: "degree_duration_months",
        label: "Degree duration (months)",
        type: "number",
      },
      {
        id: randomId(),
        key: "required_documents",
        label: "Required documents",
        type: "text",
      },
    ],
    calendar: {
      startFieldKey: "admission_start",
      endFieldKey: "admission_end",
    },
  };
}

function normalizeWorkspace(raw: unknown): Workspace {
  const baseNow = nowIso();
  const r = (raw ?? {}) as Partial<Workspace>;

  return {
    version: 1,
    admin: r.admin ?? defaultAdminSettings(),
    universities: (r.universities ?? []).map((u) => ({
      ...(u as any),
      fields: (u as any).fields ?? {},
      requiredDocumentIds: (u as any).requiredDocumentIds ?? [],
      createdAt: (u as any).createdAt ?? baseNow,
      updatedAt: (u as any).updatedAt ?? baseNow,
    })),
    programs: r.programs ?? [],
    admissionWindows: r.admissionWindows ?? [],
    documentTemplates: r.documentTemplates ?? [],
    collectedDocumentIds: r.collectedDocumentIds ?? [],
    applications: r.applications ?? [],
    applicationDocuments: r.applicationDocuments ?? [],
    uploads: (r.uploads ?? []).map((d) => ({
      ...(d as any),
      displayName:
        (d as any).displayName ?? (d as any).originalName ?? "Untitled",
      createdAt: (d as any).createdAt ?? baseNow,
      updatedAt: (d as any).updatedAt ?? (d as any).createdAt ?? baseNow,
    })),
    targets: r.targets ?? [],
    notes: r.notes ?? [],
  };
}

export async function ensureDataDirs() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

export async function loadWorkspace(): Promise<Workspace> {
  await ensureDataDirs();

  try {
    const raw = await readFile(WORKSPACE_FILE, "utf8");
    return normalizeWorkspace(JSON.parse(raw));
  } catch {
    const empty: Workspace = normalizeWorkspace({
      version: 1,
      admin: defaultAdminSettings(),
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
      collectedDocumentIds: [],
      applications: [],
      applicationDocuments: [],
      uploads: [],
      targets: [],
      notes: [],
    });

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

