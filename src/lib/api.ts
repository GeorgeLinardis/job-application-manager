import { Job, JobFormData } from "@/types/job";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? "";
const TOKEN_KEY = "joa_token";

/**
 * Base fetch wrapper for all Worker API calls.
 * Automatically attaches the stored JWT and handles non-OK responses.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const response = await fetch(`${WORKER_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  /**
   * Authenticates the owner against the Worker.
   * Returns a signed JWT on success, throws on bad credentials.
   */
  login: (username: string, password: string) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  /** Fetches all jobs from Cloudflare KV. */
  getJobs: () => request<Job[]>("/jobs"),

  /** Creates a new job in Cloudflare KV. Returns the created job record. */
  addJob: (data: JobFormData) =>
    request<Job>("/jobs", { method: "POST", body: JSON.stringify(data) }),

  /** Deletes a job by id from Cloudflare KV. */
  deleteJob: (id: string) =>
    request<{ success: boolean }>(`/jobs/${id}`, { method: "DELETE" }),
};
