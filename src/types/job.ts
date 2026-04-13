/** All possible stages in a job application's lifecycle. */
export type TimelineStatus =
  | "submitted"
  | "first_call"
  | "technical_interview"
  | "second_interview"
  | "offer_received"
  | "approved"
  | "rejected"
  | "never_answered";

/** Currency used for salary fields. */
export type SalaryCurrency = "EUR" | "USD" | "GBP";

/** Symbol per currency. */
export const SALARY_CURRENCY_SYMBOLS: Record<SalaryCurrency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

/** Where the job ad was originally found. */
export type JobSource =
  | "linkedin"
  | "job_board"
  | "company_website"
  | "referral"
  | "other";

/**
 * A single dated event in a job application's history.
 * The timeline is append-only — new stages are added, never edited.
 */
export interface TimelineEntry {
  status: TimelineStatus;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /** Optional short note for this stage. */
  note?: string;
}

/**
 * A job application record.
 * - `timeline[0]` is always "submitted" — its date is the application send date.
 * - Current status is always `timeline[timeline.length - 1].status`.
 */
export interface Job {
  id: string;
  companyName: string;
  jobTitle: string;
  jobLink: string;
  salaryExpected: number | null;
  salaryProposed: number | null;
  salaryCurrency: SalaryCurrency;
  source: JobSource;
  timeline: TimelineEntry[];
  /** Free-text notes about the job ad or application. */
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape of the add/edit form fields.
 * `dateSent` is used to auto-create the first "submitted" timeline entry on submit —
 * it is not stored directly on the Job record.
 */
export interface JobFormFields {
  companyName: string;
  jobTitle: string;
  jobLink: string;
  /** Becomes timeline[0].date when the job is created. */
  dateSent: string;
  salaryExpected: number | null;
  salaryProposed: number | null;
  salaryCurrency: SalaryCurrency;
  source: JobSource;
  notes?: string;
}

/** Full data passed to storage — form fields plus the auto-built initial timeline. */
export type JobFormData = Omit<Job, "id" | "createdAt" | "updatedAt">;

/** Human-readable labels for each timeline status. */
export const TIMELINE_STATUS_LABELS: Record<TimelineStatus, string> = {
  submitted: "Submitted",
  first_call: "First Call",
  technical_interview: "Technical Interview",
  second_interview: "Second Interview",
  offer_received: "Offer Received",
  approved: "Approved",
  rejected: "Rejected",
  never_answered: "Never Answered",
};

/** Human-readable labels for each job source. */
export const JOB_SOURCE_LABELS: Record<JobSource, string> = {
  linkedin: "LinkedIn",
  job_board: "Job Board",
  company_website: "Company Website",
  referral: "Referral",
  other: "Other",
};
