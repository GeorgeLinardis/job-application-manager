"use client";

import { useForm } from "react-hook-form";
import {
  Job,
  JobFormFields,
  JobSource,
  JOB_SOURCE_LABELS,
  SalaryCurrency,
  SALARY_CURRENCY_SYMBOLS,
} from "@/types/job";

interface JobFormProps {
  /** If provided, the form pre-fills with the job's current values (edit mode). */
  initial?: Job;
  onSubmit: (fields: JobFormFields) => Promise<void>;
  onCancel: () => void;
}

/**
 * Add / Edit job form using React Hook Form.
 * `dateSent` auto-creates the first "submitted" timeline entry on submit.
 */
export function JobForm({ initial, onSubmit, onCancel }: JobFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormFields>({
    defaultValues: initial
      ? {
          companyName: initial.companyName,
          jobTitle: initial.jobTitle,
          jobLink: initial.jobLink,
          dateSent: initial.timeline[0]?.date ?? today(),
          salaryExpected: initial.salaryExpected ?? undefined,
          salaryProposed: initial.salaryProposed ?? undefined,
          source: initial.source,
          salaryCurrency: initial.salaryCurrency,
          notes: initial.notes ?? "",
        }
      : {
          source: "linkedin",
          salaryCurrency: "EUR" as SalaryCurrency,
          dateSent: today(),
          notes: "",
        },
  });

  const sources = Object.keys(JOB_SOURCE_LABELS) as JobSource[];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Company Name" required error={errors.companyName?.message}>
          <input
            {...register("companyName", { required: "Required" })}
            placeholder="e.g. Stripe"
            className={inputClass}
          />
        </FormField>

        <FormField label="Job Title" required error={errors.jobTitle?.message}>
          <input
            {...register("jobTitle", { required: "Required" })}
            placeholder="e.g. Senior Frontend Engineer"
            className={inputClass}
          />
        </FormField>

        <FormField label="Job Ad Link" error={errors.jobLink?.message}>
          <input
            {...register("jobLink")}
            type="url"
            placeholder="https://..."
            className={inputClass}
          />
        </FormField>

        <FormField label="Date Sent" error={errors.dateSent?.message}>
          <input
            {...register("dateSent", { required: "Required" })}
            type="date"
            className={inputClass}
          />
        </FormField>

        <FormField label="Currency" error={undefined}>
          <select {...register("salaryCurrency")} className={inputClass}>
            {(Object.keys(SALARY_CURRENCY_SYMBOLS) as SalaryCurrency[]).map((currency) => (
              <option key={currency} value={currency}>
                {SALARY_CURRENCY_SYMBOLS[currency]} {currency}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Expected Salary" error={errors.salaryExpected?.message}>
          <input
            {...register("salaryExpected", { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="e.g. 60000"
            className={inputClass}
          />
        </FormField>

        <FormField label="Proposed Salary" error={errors.salaryProposed?.message}>
          <input
            {...register("salaryProposed", { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="e.g. 65000"
            className={inputClass}
          />
        </FormField>

        <FormField label="Found on" error={undefined}>
          <select {...register("source")} className={inputClass}>
            {sources.map((source) => (
              <option key={source} value={source}>
                {JOB_SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Notes" error={undefined}>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Anything relevant about this role or company..."
          className={`${inputClass} resize-none`}
        />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium shadow-sm transition-colors"
        >
          {isSubmitting ? "Saving..." : initial ? "Update Job" : "Add Job"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

/** Wraps a label, input, and optional error message. */
function FormField({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

/** Returns today's date as YYYY-MM-DD. */
function today(): string {
  return new Date().toISOString().split("T")[0];
}
