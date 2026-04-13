"use client";

import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Job, JobFormData } from "@/types/job";
import { localStore } from "@/lib/localStorage";
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

  return { jobs, isLoading, addJob, deleteJob };
}
