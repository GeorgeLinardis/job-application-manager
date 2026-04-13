"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { JobForm } from "@/components/JobForm";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Job, JobFormData, JobFormFields } from "@/types/job";

/**
 * AuthStatus is excluded from static HTML (`ssr: false`).
 * It renders blank in the pre-built page and mounts instantly correct on the client.
 * This eliminates the guest→owner flicker on refresh.
 */
const AuthStatus = dynamic(() => import("@/components/AuthStatus"), {
  ssr: false,
});

export default function Home() {
  const { jobs, isLoading, addJob, deleteJob } = useJobs();
  const [showForm, setShowForm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  /**
   * Converts form fields into JobFormData by auto-creating
   * the first "submitted" timeline entry from the dateSent field.
   */
  async function handleAddJob(fields: JobFormFields): Promise<void> {
    const jobData: JobFormData = {
      companyName: fields.companyName,
      jobTitle: fields.jobTitle,
      jobLink: fields.jobLink,
      salaryExpected: fields.salaryExpected,
      salaryProposed: fields.salaryProposed,
      source: fields.source,
      timeline: [{ status: "submitted", date: fields.dateSent }],
    };
    await addJob(jobData);
    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BriefcaseBusiness className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-gray-900">Job Tracker</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Job
            </button>
            <AuthStatus />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">New Application</h2>
            <JobForm
              onSubmit={handleAddJob}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-gray-500">No applications yet</p>
            <p className="text-sm mt-1">
              Click &quot;+ Add Job&quot; to track your first application.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{job.companyName}</p>
                  <p className="text-sm text-gray-500">{job.jobTitle}</p>
                </div>
                <button
                  onClick={() => setJobToDelete(job)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {jobToDelete && (
        <ConfirmModal
          message={`Delete application to ${jobToDelete.companyName}? This cannot be undone.`}
          onConfirm={async () => {
            await deleteJob(jobToDelete.id);
            setJobToDelete(null);
          }}
          onCancel={() => setJobToDelete(null)}
        />
      )}
    </main>
  );
}
