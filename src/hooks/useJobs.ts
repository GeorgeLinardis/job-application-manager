"use client";

import { useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Job, JobFormData } from "@/types/job";
import { localStore } from "@/lib/localStorage";
import { DEMO_JOBS } from "@/lib/demoData";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const JOBS_QUERY_KEY = "jobs";

/**
 * Unified jobs hook backed by React Query.
 * - Owner (logged in): fetches from Worker API → Cloudflare KV, cached for 1 min
 * - Guest: reads from localStorage (synchronous, no network)
 *
 * React Query caches the last response so returning users see data immediately
 * on revisit without a loading flash.
 */
export function useJobs() {
  const { isOwner } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Evicts the stale cache for the opposite role whenever auth state changes.
   * Prevents cached owner jobs from persisting after logout (and vice versa).
   */
  useEffect(() => {
    queryClient.removeQueries({ queryKey: [JOBS_QUERY_KEY, !isOwner] });
  }, [isOwner, queryClient]);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: [JOBS_QUERY_KEY, isOwner],
    queryFn: () => (isOwner ? api.getJobs() : localStore.getAll()),
  });

  /** Creates a new job and updates the cache immediately (optimistic). */
  const { mutateAsync: addJob } = useMutation({
    mutationFn: (data: JobFormData): Promise<Job> =>
      isOwner
        ? api.addJob(data)
        : Promise.resolve(localStore.add(data)),
    onSuccess: (newJob) => {
      queryClient.setQueryData<Job[]>([JOBS_QUERY_KEY, isOwner], (previous = []) => [
        newJob,
        ...previous,
      ]);
    },
  });

  /** Updates a job and replaces it in the cache immediately. */
  const { mutateAsync: updateJob } = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<JobFormData> }): Promise<Job> => {
      if (isOwner) return api.updateJob(id, patch);
      const updated = localStore.update(id, patch);
      if (!updated) throw new Error("Job not found");
      return Promise.resolve(updated);
    },
    onSuccess: (updatedJob) => {
      queryClient.setQueryData<Job[]>([JOBS_QUERY_KEY, isOwner], (previous = []) =>
        previous.map((job) => (job.id === updatedJob.id ? updatedJob : job))
      );
    },
  });

  /** Deletes a job and removes it from the cache immediately. */
  const { mutateAsync: deleteJob } = useMutation({
    mutationFn: (id: string): Promise<void> =>
      isOwner
        ? api.deleteJob(id).then(() => undefined)
        : Promise.resolve(localStore.remove(id)),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Job[]>([JOBS_QUERY_KEY, isOwner], (previous = []) =>
        previous.filter((job) => job.id !== id)
      );
    },
  });

  /** Loads 10 demo jobs into localStorage (guest only). */
  const { mutateAsync: loadDemoData } = useMutation({
    mutationFn: async (): Promise<Job[]> =>
      DEMO_JOBS.map((data) => localStore.add(data)),
    onSuccess: (added) => {
      queryClient.setQueryData<Job[]>(
        [JOBS_QUERY_KEY, false],
        (previous = []) => [...added, ...previous]
      );
    },
  });

  /** Clears all jobs from localStorage (guest only). */
  const { mutateAsync: clearAllJobs } = useMutation({
    mutationFn: async (): Promise<void> => localStore.clear(),
    onSuccess: () => {
      queryClient.setQueryData<Job[]>([JOBS_QUERY_KEY, false], []);
    },
  });

  return { jobs, isLoading, addJob, updateJob, deleteJob, loadDemoData, clearAllJobs };
}
