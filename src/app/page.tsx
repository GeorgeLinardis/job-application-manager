"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { BriefcaseBusiness, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/context/AuthContext";
import { JobForm } from "@/components/JobForm";
import { ConfirmModal } from "@/components/ConfirmModal";
import { StatusBadge } from "@/components/StatusBadge";
import { TimelineEditor } from "@/components/TimelineEditor";
import {
  Job,
  JobFormData,
  JobFormFields,
  TimelineEntry,
  TimelineStatus,
  TIMELINE_STATUS_LABELS,
} from "@/types/job";

/**
 * AuthStatus is excluded from static HTML (`ssr: false`).
 * It renders blank in the pre-built page and mounts instantly correct on the client.
 * This eliminates the guest→owner flicker on refresh.
 */
const AuthStatus = dynamic(() => import("@/components/AuthStatus"), {
  ssr: false,
});

export default function Home() {
  const { isOwner } = useAuth();
  const { jobs, isLoading, addJob, updateJob, deleteJob, loadDemoData, clearAllJobs } = useJobs();
  const [showForm, setShowForm] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TimelineStatus | "all">("all");

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
      salaryCurrency: fields.salaryCurrency,
      source: fields.source,
      notes: fields.notes || undefined,
      timeline: [{ status: "submitted", date: fields.dateSent }],
    };
    await addJob(jobData);
    setShowForm(false);
  }

  /**
   * Appends a new stage to the job's timeline without modifying existing entries.
   */
  async function handleAddStage(entry: TimelineEntry): Promise<void> {
    if (!jobToEdit) return;
    await updateJob({
      id: jobToEdit.id,
      patch: { timeline: [...jobToEdit.timeline, entry] },
    });
    // Keep the edit panel open so the user sees the updated timeline.
    setJobToEdit((prev) =>
      prev ? { ...prev, timeline: [...prev.timeline, entry] } : null
    );
  }

  /**
   * Builds a patch from edited form fields and persists it.
   * Preserves the full timeline — only updates timeline[0].date if dateSent changed.
   */
  async function handleUpdateJob(fields: JobFormFields): Promise<void> {
    if (!jobToEdit) return;
    const updatedTimeline = jobToEdit.timeline.map((entry, index) =>
      index === 0 ? { ...entry, date: fields.dateSent } : entry
    );
    const patch: Partial<JobFormData> = {
      companyName: fields.companyName,
      jobTitle: fields.jobTitle,
      jobLink: fields.jobLink,
      salaryExpected: fields.salaryExpected,
      salaryProposed: fields.salaryProposed,
      salaryCurrency: fields.salaryCurrency,
      source: fields.source,
      notes: fields.notes || undefined,
      timeline: updatedTimeline,
    };
    await updateJob({ id: jobToEdit.id, patch });
    setJobToEdit(null);
  }

  const inProgressCount = jobs.filter((job) => {
    const status = job.timeline[job.timeline.length - 1]?.status;
    return status !== "rejected" && status !== "never_answered";
  }).length;

  /** Jobs after applying company name search and status filter. */
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.companyName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const currentStatus = job.timeline[job.timeline.length - 1]?.status;
    const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = Object.keys(TIMELINE_STATUS_LABELS) as TimelineStatus[];

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
              onClick={() => { setShowForm(true); setJobToEdit(null); }}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Job
            </button>
            <AuthStatus />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Add form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">New Application</h2>
            <JobForm
              onSubmit={handleAddJob}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Edit form */}
        {jobToEdit && (
          <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">
              Edit — {jobToEdit.companyName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <JobForm
                initial={jobToEdit}
                onSubmit={handleUpdateJob}
                onCancel={() => setJobToEdit(null)}
              />
              <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-6">
                <TimelineEditor job={jobToEdit} onAddStage={handleAddStage} />
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        {!isLoading && jobs.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search company..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as TimelineStatus | "all")
                }
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="all">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {TIMELINE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 pr-3">
              {!isOwner && (
                <button
                  onClick={() => clearAllJobs()}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              )}
              <p className="text-sm font-medium text-gray-500">
                <span className="text-gray-900 font-semibold">{inProgressCount}</span> in progress
              </p>
            </div>
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
            {!isOwner && (
              <button
                onClick={() => loadDemoData()}
                className="mt-4 px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition-colors font-medium"
              >
                Load demo data
              </button>
            )}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium text-gray-500">No matching applications</p>
            <p className="text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredJobs.map((job) => {
              const lastEntry = job.timeline[job.timeline.length - 1];
              const currentStatus = lastEntry?.status ?? "submitted";
              const appliedDate = job.timeline[0]?.date;
              const isEditing = jobToEdit?.id === job.id;
              return (
                <li
                  key={job.id}
                  className={`bg-white border rounded-xl px-5 py-4 shadow-sm flex items-center justify-between gap-4 transition-colors ${
                    isEditing ? "border-indigo-300" : "border-gray-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {job.companyName}
                      </p>
                      <StatusBadge status={currentStatus} />
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {job.jobTitle}
                    </p>
                    {appliedDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        Applied {formatDate(appliedDate)}
                      </p>
                    )}
                    {lastEntry && job.timeline.length > 1 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(lastEntry.date)}
                        {lastEntry.note && (
                          <span className="text-gray-400"> · {lastEntry.note}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setJobToEdit(job); setShowForm(false); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isEditing
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                      }`}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setJobToDelete(job)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
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

/** Formats a YYYY-MM-DD date string as "Apr 3, 2026". */
function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
