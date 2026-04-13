import { Job, JobFormData } from "@/types/job";
import { TOKEN_KEY, WORKER_URL } from "@/lib/constants";

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
  login: (username: string, password: string, rememberMe: boolean) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, rememberMe }),
    }),

  /** Fetches all jobs from Cloudflare KV. */
  getJobs: () => request<Job[]>("/jobs"),

  /** Creates a new job in Cloudflare KV. Returns the created job record. */
  addJob: (data: JobFormData) =>
    request<Job>("/jobs", { method: "POST", body: JSON.stringify(data) }),

  /** Deletes a job by id from Cloudflare KV. */
  deleteJob: (id: string) =>
    request<{ success: boolean }>(`/jobs/${id}`, { method: "DELETE" }),

  /** Updates an existing job by id in Cloudflare KV. Returns the updated job. */
  updateJob: (id: string, patch: Partial<JobFormData>) =>
    request<Job>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
};
