export type UUID = string;

export type UploadedDoc = {
  id: UUID;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string; // ISO
  notes?: string;
};

export type University = {
  id: UUID;
  name: string;
  city?: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Program = {
  id: UUID;
  universityId: UUID;
  name: string;
  degreeLevel?: "bachelors" | "masters" | "phd" | "other";
  durationMonths?: number;
  language?: string;
  vpdRequired?: boolean;
  ieltsOverall?: number;
  ieltsMinBand?: number;
  documentsNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdmissionWindow = {
  id: UUID;
  programId: UUID;
  intakeTerm?: string; // e.g. Winter 2026
  admissionStart?: string; // YYYY-MM-DD
  admissionEnd?: string; // YYYY-MM-DD
  applicationDeadline?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentTemplate = {
  id: UUID;
  name: string;
  category?: string;
  requiredByDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Application = {
  id: UUID;
  programId: UUID;
  status:
    | "researching"
    | "planned"
    | "applying"
    | "submitted"
    | "accepted"
    | "rejected"
    | "on_hold";
  priority: 1 | 2 | 3 | 4 | 5;
  targetIntake?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationDocument = {
  id: UUID;
  applicationId: UUID;
  templateId: UUID;
  status: "todo" | "in_progress" | "done" | "not_required";
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Workspace = {
  version: 1;
  universities: University[];
  programs: Program[];
  admissionWindows: AdmissionWindow[];
  documentTemplates: DocumentTemplate[];
  applications: Application[];
  applicationDocuments: ApplicationDocument[];
  uploads: UploadedDoc[];
};

