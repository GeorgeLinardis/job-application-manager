import { TimelineStatus, TIMELINE_STATUS_LABELS } from "@/types/job";

/** Tailwind classes per status — bg + text color pair. */
const STATUS_STYLES: Record<TimelineStatus, string> = {
  submitted: "bg-gray-100 text-gray-600",
  first_call: "bg-blue-100 text-blue-700",
  technical_interview: "bg-indigo-100 text-indigo-700",
  second_interview: "bg-purple-100 text-purple-700",
  offer_received: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  never_answered: "bg-orange-100 text-orange-700",
};

interface StatusBadgeProps {
  status: TimelineStatus;
}

/** Pill badge displaying a job's current timeline status with a color per stage. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {TIMELINE_STATUS_LABELS[status]}
    </span>
  );
}
