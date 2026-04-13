"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import {
  Job,
  TimelineEntry,
  TimelineStatus,
  TIMELINE_STATUS_LABELS,
} from "@/types/job";
import { StatusBadge } from "@/components/StatusBadge";

interface AddStageFields {
  status: TimelineStatus;
  date: string;
  note: string;
}

interface TimelineEditorProps {
  job: Job;
  /** Called with the new entry to append. Should persist and update cache. */
  onAddStage: (entry: TimelineEntry) => Promise<void>;
}

const statuses = Object.keys(TIMELINE_STATUS_LABELS) as TimelineStatus[];

/** Returns today's date as YYYY-MM-DD. */
function today(): string {
  return new Date().toISOString().split("T")[0];
}

/** Formats a YYYY-MM-DD date string as "Apr 3, 2026". */
function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Displays the full timeline history of a job and a form to append a new stage.
 * The timeline is append-only — existing entries are never modified.
 */
export function TimelineEditor({ job, onAddStage }: TimelineEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AddStageFields>({
    defaultValues: { status: "first_call", date: today(), note: "" },
  });

  async function onSubmit(fields: AddStageFields): Promise<void> {
    const entry: TimelineEntry = {
      status: fields.status,
      date: fields.date,
      ...(fields.note.trim() ? { note: fields.note.trim() } : {}),
    };
    await onAddStage(entry);
    reset({ status: "first_call", date: today(), note: "" });
    setShowAddForm(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Timeline</p>

      {/* History */}
      <ol className="relative border-l border-gray-200 ml-2 space-y-3">
        {job.timeline.map((entry, index) => (
          <li key={index} className="pl-5">
            <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-white border-2 border-gray-300" />
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={entry.status} />
              <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
              {entry.note && (
                <span className="text-xs text-gray-500 italic">{entry.note}</span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Add stage */}
      {showAddForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-wrap items-end gap-2 pt-1"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Stage</label>
            <select
              {...register("status")}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {TIMELINE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              {...register("date", { required: true })}
              type="date"
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-32">
            <label className="text-xs font-medium text-gray-600">
              Note <span className="text-gray-400">(optional)</span>
            </label>
            <input
              {...register("note")}
              type="text"
              placeholder="e.g. with CTO"
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
            >
              {isSubmitting ? "Saving..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Add stage
        </button>
      )}
    </div>
  );
}
