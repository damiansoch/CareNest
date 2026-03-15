// ─── Auth & Users ────────────────────────────────────────────────────────────

export type Language = "pl" | "en";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  preferred_language: Language;
}

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export type Role = "admin" | "member";

export interface Membership {
  id: string;
  user: User;
  role: Role;
  joined_at: string;
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Invitation {
  id: string;
  token: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
  invited_by: User;
}

// ─── Seniors ─────────────────────────────────────────────────────────────────

export interface AccessibilityPreferences {
  large_text?: boolean;
  high_contrast?: boolean;
}

export interface Senior {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  notes: string;
  preferred_language: Language;
  photo: string | null;
  accessibility_preferences: AccessibilityPreferences;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Medications ─────────────────────────────────────────────────────────────

export type MedicationForm =
  | "tablet"
  | "capsule"
  | "liquid"
  | "injection"
  | "patch"
  | "drops"
  | "inhaler"
  | "other";

export type TimeOfDay =
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "bedtime"
  | "custom";

export interface MedicationSchedule {
  id?: string;
  time_of_day: TimeOfDay;
  custom_time?: string | null;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  form: MedicationForm;
  instructions: string;
  notes: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  schedules: MedicationSchedule[];
  created_at: string;
  updated_at: string;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export interface ReminderConfig {
  id?: string;
  offset_hours: 2 | 24;
  is_enabled: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  doctor_name: string;
  location: string;
  datetime: string;
  notes: string;
  assigned_caregiver: User | null;
  reminder_configs: ReminderConfig[];
  created_at: string;
  updated_at: string;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export type DocumentCategory =
  | "medical_report"
  | "prescription"
  | "lab_result"
  | "insurance"
  | "identity"
  | "consent_form"
  | "referral"
  | "discharge_summary"
  | "other";

export interface DocumentPageMeta {
  id: string;
  page_number: number;
  mime_type: "image/jpeg" | "image/png" | "application/pdf";
  file_size: number;
}

export interface DocumentUploader {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  category_display: string;
  tags: string[];
  page_count: number;
  total_size_bytes: number;
  uploaded_by: DocumentUploader | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends Document {
  pages: DocumentPageMeta[];
}

// ─── API pagination ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
