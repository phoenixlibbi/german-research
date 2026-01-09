export type UUID = string;

export type UploadedDoc = {
  id: UUID;
  templateId?: UUID; // Link to document template
  displayName: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  notes?: string;
};

export type FieldType = "string" | "number" | "date" | "boolean" | "url" | "text";

export type UniversityFieldDefinition = {
  id: UUID;
  key: string; // stored in University.fields[key]
  label: string;
  type: FieldType;
  required?: boolean;
};

export type AdminSettings = {
  universityFields: UniversityFieldDefinition[];
  calendar: {
    startFieldKey: string | null;
    endFieldKey: string | null;
  };
};

export type University = {
  id: UUID;
  name: string;
  city?: string;
  website?: string;
  degreeTitle?: string;
  durationSemesters?: number;
  // Fee (store as number; UI currently assumes EUR)
  tuitionFeePerSemester?: number;
  // Tests / language requirements
  germanLanguageTestRequired?: boolean;
  requiredDocumentIds: UUID[]; // IDs from documentTemplates
  notes?: string;
  fields: Record<string, string | number | boolean | null>;
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

export type Target = {
  id: UUID;
  name: string;
  description?: string;
  targetDate?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: UUID;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type Workspace = {
  version: 1;
  admin: AdminSettings;
  universities: University[];
  programs: Program[];
  admissionWindows: AdmissionWindow[];
  documentTemplates: DocumentTemplate[];
  collectedDocumentIds: UUID[]; // Document templates the user has collected
  applications: Application[];
  applicationDocuments: ApplicationDocument[];
  uploads: UploadedDoc[];
  targets: Target[];
  notes: Note[];
};

