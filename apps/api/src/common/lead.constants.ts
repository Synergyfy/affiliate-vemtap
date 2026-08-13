/**
 * Canonical lead pipeline statuses for the unified Lead model.
 *
 * A lead is the primary record for any captured business. A lead becomes a
 * "visit" (visited lead) the moment it is marked as visited — i.e. its status
 * leaves NOT_YET and its `visitedAt` is stamped.
 */
export const LEAD_STATUSES = [
  "NOT_YET",
  "VISITED",
  "CONTACTED",
  "INTERESTED",
  "NOT_INTERESTED",
  "CUSTOMER",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const VISITED_LEAD_STATUSES = LEAD_STATUSES.filter(
  (status) => status !== "NOT_YET",
);

export function isVisitedLeadStatus(status?: string | null): boolean {
  return status ? status !== "NOT_YET" : false;
}

/** Legacy lead statuses accepted by older clients, mapped to canonical ones. */
export const LEGACY_LEAD_STATUS_MAP: Record<string, string> = {
  POTENTIAL: "NOT_YET",
  COMPLETED: "CUSTOMER",
};

/** Statuses accepted on create/update, including legacy ones for old clients. */
export const ALLOWED_LEAD_STATUSES = [
  ...LEAD_STATUSES,
  ...Object.keys(LEGACY_LEAD_STATUS_MAP),
];

/** Normalizes a submitted status to a canonical pipeline status. */
export function normalizeLeadStatus(status?: string | null): string {
  if (!status) return "NOT_YET";
  return LEGACY_LEAD_STATUS_MAP[status] ?? status;
}
