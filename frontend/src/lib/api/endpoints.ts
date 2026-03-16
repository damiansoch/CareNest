import { apiClient } from "./client";
import type {
  Appointment,
  Document,
  DocumentDetail,
  Family,
  Invitation,
  Medication,
  Membership,
  PaginatedResponse,
  Senior,
  User,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    family_name?: string;
    invitation_token?: string;
  }) => apiClient.post<{ user: User; access: string; refresh: string }>("/auth/register/", data),

  login: (email: string, password: string) =>
    apiClient.post<{ access: string; refresh: string }>("/auth/login/", {
      email,
      password,
    }),

  me: () => apiClient.get<User>("/auth/me/"),

  updateMe: (data: Partial<Pick<User, "first_name" | "last_name" | "preferred_language">>) =>
    apiClient.patch<User>("/auth/me/", data),

  checkInvitation: (token: string) =>
    apiClient.get<{ email: string; family_name: string; role: string }>(
      `/auth/invitations/${token}/`
    ),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ detail: string }>("/auth/password-reset/", { email }),

  confirmPasswordReset: (uid: string, token: string, password: string) =>
    apiClient.post<{ detail: string }>("/auth/password-reset/confirm/", {
      uid,
      token,
      password,
    }),
};

// ─── Family ───────────────────────────────────────────────────────────────────

export const familyApi = {
  get: () => apiClient.get<Family>("/family/"),
  update: (data: { name: string }) => apiClient.patch<Family>("/family/", data),
  members: () => apiClient.get<PaginatedResponse<Membership>>("/family/members/"),
  invitations: () => apiClient.get<PaginatedResponse<Invitation>>("/family/invitations/"),
  invite: (data: { email: string; role: string }) =>
    apiClient.post<Invitation>("/family/invitations/", data),
  removeMember: (membershipId: string) =>
    apiClient.delete(`/family/members/${membershipId}/`),
};

// ─── Seniors ─────────────────────────────────────────────────────────────────

export const seniorsApi = {
  list: (params?: { archived?: boolean; search?: string }) =>
    apiClient.get<PaginatedResponse<Senior>>("/seniors/", { params }),
  get: (id: string) => apiClient.get<Senior>(`/seniors/${id}/`),
  create: (data: Partial<Senior>) => apiClient.post<Senior>("/seniors/", data),
  update: (id: string, data: Partial<Senior>) =>
    apiClient.patch<Senior>(`/seniors/${id}/`, data),
  archive: (id: string) => apiClient.delete(`/seniors/${id}/`),
};

// ─── Medications ─────────────────────────────────────────────────────────────

export const medicationsApi = {
  list: (seniorId: string, params?: { active?: boolean }) =>
    apiClient.get<PaginatedResponse<Medication>>(
      `/seniors/${seniorId}/medications/`,
      { params }
    ),
  get: (seniorId: string, id: string) =>
    apiClient.get<Medication>(`/seniors/${seniorId}/medications/${id}/`),
  create: (seniorId: string, data: Partial<Medication>) =>
    apiClient.post<Medication>(`/seniors/${seniorId}/medications/`, data),
  update: (seniorId: string, id: string, data: Partial<Medication>) =>
    apiClient.patch<Medication>(`/seniors/${seniorId}/medications/${id}/`, data),
  deactivate: (seniorId: string, id: string) =>
    apiClient.delete(`/seniors/${seniorId}/medications/${id}/`),
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointmentsApi = {
  listAll: (params?: { upcoming?: boolean }) =>
    apiClient.get<PaginatedResponse<Appointment & { senior_id: string; senior_name: string }>>(
      "/appointments/",
      { params: params ? { upcoming: params.upcoming ? "true" : undefined } : undefined }
    ),

  list: (seniorId: string) =>
    apiClient.get<PaginatedResponse<Appointment>>(
      `/seniors/${seniorId}/appointments/`
    ),
  get: (seniorId: string, id: string) =>
    apiClient.get<Appointment>(`/seniors/${seniorId}/appointments/${id}/`),
  create: (seniorId: string, data: Partial<Appointment>) =>
    apiClient.post<Appointment>(`/seniors/${seniorId}/appointments/`, data),
  update: (seniorId: string, id: string, data: Partial<Appointment>) =>
    apiClient.patch<Appointment>(
      `/seniors/${seniorId}/appointments/${id}/`,
      data
    ),
  delete: (seniorId: string, id: string) =>
    apiClient.delete(`/seniors/${seniorId}/appointments/${id}/`),
};

// ─── Documents ─────────────────────────────────────────────────────────────

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export const documentsApi = {
  list: (
    seniorId: string,
    params?: { category?: string; tags?: string; ordering?: string }
  ) =>
    apiClient.get<PaginatedResponse<Document>>(
      `/seniors/${seniorId}/documents/`,
      { params }
    ),

  get: (seniorId: string, id: string) =>
    apiClient.get<DocumentDetail>(`/seniors/${seniorId}/documents/${id}/`),

  upload: (seniorId: string, formData: FormData) =>
    apiClient.post<Document>(`/seniors/${seniorId}/documents/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (
    seniorId: string,
    id: string,
    data: { name?: string; category?: string; tags?: string[] }
  ) => apiClient.patch<Document>(`/seniors/${seniorId}/documents/${id}/`, data),

  delete: (seniorId: string, id: string) =>
    apiClient.delete(`/seniors/${seniorId}/documents/${id}/`),

  /** Returns the URL string for fetching raw page binary content. */
  pageContentUrl: (seniorId: string, docId: string, pageId: string) =>
    `${API_BASE}/seniors/${seniorId}/documents/${docId}/pages/${pageId}/content/`,
};
