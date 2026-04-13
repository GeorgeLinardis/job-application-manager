"use client";

import { Job, TimelineStatus, TIMELINE_STATUS_LABELS } from "@/types/job";

interface JobChartsProps {
  jobs: Job[];
}

const COMPLETED_STATUSES: TimelineStatus[] = ["approved", "rejected", "never_answered"];

const STATUS_COLORS: Record<TimelineStatus, string> = {
  submitted: "bg-gray-400",
  first_call: "bg-blue-400",
  technical_interview: "bg-indigo-500",
  second_interview: "bg-violet-500",
  offer_received: "bg-amber-400",
  approved: "bg-green-500",
  rejected: "bg-red-400",
  never_answered: "bg-orange-400",
};

/** Groups jobs by submission month, returns sorted entries. */
function groupByMonth(jobs: Job[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  const order: string[] = [];

  for (const job of jobs) {
    const date = job.timeline[0]?.date;
    if (!date) continue;
    const label = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (!map[label]) {
      map[label] = 0;
      order.push(label);
    }
    map[label]++;
  }

  return order.map((label) => ({ label, count: map[label] }));
}

/** Counts jobs per current status. */
function groupByStatus(jobs: Job[]): { status: TimelineStatus; count: number }[] {
  const map: Partial<Record<TimelineStatus, number>> = {};
  for (const job of jobs) {
    const status = job.timeline[job.timeline.length - 1]?.status;
    if (!status) continue;
    map[status] = (map[status] ?? 0) + 1;
  }
  return (Object.entries(map) as [TimelineStatus, number][])
    .sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1])
    .map(([status, count]) => ({ status, count }));
}

/** A single top-level stat card. */
function StatCard({ value, label, accent = false }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-indigo-50 border-indigo-100" : "bg-white border-gray-200"} shadow-sm`}>
      <p className={`text-3xl font-bold ${accent ? "text-indigo-600" : "text-gray-900"}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

/** A single horizontal bar row. */
function BarRow({
  label,
  count,
  max,
  colorClass,
}: {
  label: string;
  count: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClass} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-4 text-right shrink-0">{count}</span>
    </div>
  );
}

/** Vertical bar chart for monthly data. */
function VerticalBarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((row) => row.count));
  return (
    <div className="flex items-end gap-2 h-36 pt-4">
      {data.map((row) => {
        const heightPct = max > 0 ? (row.count / max) * 100 : 0;
        return (
          <div key={row.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-xs font-medium text-gray-500">{row.count}</span>
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-colors"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 truncate w-full text-center">{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Section wrapper. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {children}
    </div>
  );
}

/** Full analytics view — stat cards + bar charts. No external dependencies. */
export function JobCharts({ jobs }: JobChartsProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="font-medium text-gray-500">No data yet</p>
        <p className="text-sm mt-1">Add some applications to see your analytics.</p>
      </div>
    );
  }

  const inProgress = jobs.filter((job) => {
    const status = job.timeline[job.timeline.length - 1]?.status;
    return status && !COMPLETED_STATUSES.includes(status);
  }).length;

  const completed = jobs.length - inProgress;

  const offers = jobs.filter(
    (job) => job.timeline[job.timeline.length - 1]?.status === "offer_received" ||
             job.timeline[job.timeline.length - 1]?.status === "approved"
  ).length;

  const byMonth = groupByMonth(jobs);
  const byStatus = groupByStatus(jobs);
  const maxMonth = Math.max(...byMonth.map((row) => row.count));
  const maxStatus = Math.max(...byStatus.map((row) => row.count));

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={jobs.length} label="Total applications" />
        <StatCard value={inProgress} label="In progress" accent />
        <StatCard value={offers} label="Offers received" />
        <StatCard value={completed} label="Completed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vertical bar — submissions per month */}
        <Section title="Submissions per month">
          {byMonth.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <VerticalBarChart data={byMonth} />
          )}
        </Section>

        {/* Applications by status */}
        <Section title="Applications by status">
          <div className="space-y-2.5">
            {byStatus.map((row) => (
              <BarRow
                key={row.status}
                label={TIMELINE_STATUS_LABELS[row.status]}
                count={row.count}
                max={maxStatus}
                colorClass={STATUS_COLORS[row.status]}
              />
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly breakdown */}
        <Section title="Monthly breakdown">
          {byMonth.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-2.5">
              {byMonth.map((row) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  count={row.count}
                  max={maxMonth}
                  colorClass="bg-indigo-500"
                />
              ))}
            </div>
          )}
        </Section>

        {/* In progress vs completed */}
        <Section title="Progress breakdown">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2.5">
            <BarRow label="In progress" count={inProgress} max={jobs.length} colorClass="bg-indigo-500" />
            <BarRow label="Completed" count={completed} max={jobs.length} colorClass="bg-gray-400" />
            <BarRow label="Offers / approved" count={offers} max={jobs.length} colorClass="bg-green-500" />
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-gray-900">
              {jobs.length > 0 ? Math.round((inProgress / jobs.length) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-400">active rate</p>
          </div>
        </div>
      </Section>
      </div>
    </div>
  );
}
