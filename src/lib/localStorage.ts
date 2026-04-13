import { Job, JobFormData } from "@/types/job";
import { v4 as uuidv4 } from "uuid";

/** localStorage key for guest job data. */
const STORAGE_KEY = "joa_guest_jobs";

/**
 * Reads all guest jobs from localStorage.
 * Returns an empty array if nothing is stored or on parse error.
 */
function readFromStorage(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Job[]) : [];
  } catch {
    return [];
  }
}

/**
 * Writes the full jobs array to localStorage.
 */
function writeToStorage(jobs: Job[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export const localStore = {
  /** Returns all guest jobs. */
  getAll: readFromStorage,

  /**
   * Creates a new job, prepends it to the list, and persists to localStorage.
   * Returns the created job.
   */
  add(data: JobFormData): Job {
    const jobs = readFromStorage();
    const now = new Date().toISOString();
    const newJob: Job = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    writeToStorage([newJob, ...jobs]);
    return newJob;
  },

  /**
   * Partially updates a job by id and persists to localStorage.
   * Returns the updated job, or null if not found.
   */
  update(id: string, patch: Partial<JobFormData>): Job | null {
    const jobs = readFromStorage();
    const index = jobs.findIndex((job) => job.id === id);
    if (index === -1) return null;
    const updatedJob: Job = {
      ...jobs[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    jobs[index] = updatedJob;
    writeToStorage(jobs);
    return updatedJob;
  },

  /**
   * Removes a job by id from localStorage.
   */
  remove(id: string): void {
    writeToStorage(readFromStorage().filter((job) => job.id !== id));
  },
};
