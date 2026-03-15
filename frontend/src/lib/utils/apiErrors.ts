import { AxiosError } from "axios";

/**
 * Extracts human-readable error messages from an Axios API error response.
 * Handles DRF-style field error objects: { field: ["msg1", "msg2"], ... }
 * Falls back to a generic Polish message.
 */
export function extractApiErrors(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    const messages: string[] = [];

    for (const [field, errs] of Object.entries(data)) {
      if (Array.isArray(errs)) {
        const fieldLabel = field === "non_field_errors" ? "" : `${field}: `;
        messages.push(`${fieldLabel}${errs.join(", ")}`);
      } else if (typeof errs === "string") {
        messages.push(errs);
      }
    }

    if (messages.length) return messages.join("\n");
  }
  return "Wystąpił błąd. Spróbuj ponownie.";
}
