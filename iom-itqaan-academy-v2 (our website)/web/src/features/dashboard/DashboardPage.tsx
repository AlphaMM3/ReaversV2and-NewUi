import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  CalendarClock,
  AlertTriangle,
  Play,
  Square,
  CheckCheck,
  Download,
} from "lucide-react";
import {
  apiRequest,
  type MeUser,
  type DashboardSummary,
  type ClassSessionRow,
} from "@/lib/api";
import { dayKeyDhaka, formatDateTimeDhaka, formatTimeDhaka } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";

export function DashboardPage({
  user,
  onNotify,
  onNavigate,
}: {
  user: MeUser;
  onNotify: (message: string, tone?: "ok" | "err") => void;
  onNavigate: (nav: "packages-contracts" | "invoices" | "teacher-payables" | "audit") => void;
}) {
  const queryClient = useQueryClient();
  const isStaff = !user.role.startsWith("guardian");
  const isAdmin = ["central_admin", "branch_admin"].includes(user.role);
  const todayStr = dayKeyDhaka(new Date());
  const baseDate = new Date(todayStr + "T12:00:00Z");
  const prevStr = new Date(baseDate.getTime() - 86400_000).toISOString().slice(0, 10);
  const nextStr = new Date(baseDate.getTime() + 86400_000).toISOString().slice(0, 10);

  const [summaryQ, todayQ, recentQ, reportsQ, leavesQ, followupsQ] = useQueries({
    queries: [
      {
        queryKey: ["summary", user.role],
        queryFn: () => apiRequest<DashboardSummary>("/summary"),
      },
      {
        queryKey: ["classes-today", todayStr, user.role],
        queryFn: () =>
          apiRequest<ClassSessionRow[]>(
            `/classes?from=${prevStr}&until=${nextStr}T23:59:59Z&limit=200`,
          ),
      },
      {
        queryKey: ["classes-recent", user.role],
        queryFn: () => apiRequest<ClassSessionRow[]>("/classes?limit=10"),
      },
      {
        queryKey: ["reports-overview", user.role],
        queryFn: () => apiRequest<any[]>("/reports"),
        enabled: isStaff,
      },
      {
        queryKey: ["leaves-pending", user.role],
        queryFn: () => apiRequest<any[]>("/leaves?status=pending"),
        enabled: isAdmin || user.role === "zimmadar",
      },
      {
        queryKey: ["followups-pending", user.role],
        queryFn: () => apiRequest<{ items: any[]; next_before: number | null }>("/followups?status=pending"),
        enabled: isStaff,
      },
    ],
  });

  const classAction = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "start" | "end" | "verify-held" }) =>
      apiRequest<{ meeting_url?: string }>(`/classes/${id}/${action}`, { method: "POST" }),
    onSuccess: (_data, vars) => {
      onNotify(`Class #CLS-${String(vars.id).padStart(4, "0")} updated.`);
      queryClient.invalidateQueries({ queryKey: ["classes-today"] });
      queryClient.invalidateQueries({ queryKey: ["classes-recent"] });
    },
    onError: (err: Error) => onNotify(err.message, "err"),
  });

  if (summaryQ.isLoading && todayQ.isLoading) {
    return <PageSkeleton />;
  }

  const summary = summaryQ.data || {
    students: 0,
    enrollments: 0,
    classes: 0,
    group_enrollments: 0,
    one_to_one_enrollments: 0,
    active_enrollments: 0,
  };
  const todayClasses = (todayQ.data || []).filter(
    (c) => c.scheduled_start && dayKeyDhaka(c.scheduled_start) === todayStr,
  );
  const recentClasses = recentQ.data || [];
  const reports = reportsQ.data || [];
  const pendingReports = reports.filter((r) => ["submitted", "returned"].includes(r.status));
  const pendingLeaves = leavesQ.data || [];
  const pendingFollowups = followupsQ.data?.items || [];
  const actionCount = pendingReports.length + pendingLeaves.length + pendingFollowups.length;

  const groupPct = summary.enrollments
    ? Math.round((summary.group_enrollments / summary.enrollments) * 100)
    : 0;

  const hasError = [summaryQ, todayQ, recentQ].some((q) => q.isError);

  return (
    <div className="space-y-5">
      {hasError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800"
        >
          Some dashboard metrics could not be loaded. Displayed counts may be incomplete.
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-slate-500">Active Learners</div>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                {summary.students}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {summary.active_enrollments} active enrollments
              </div>
            </div>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-500">Course Enrollments</div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {summary.enrollments}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full"
                  style={{ width: `${groupPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 tabular-nums">
                <span>{summary.group_enrollments} Group</span>
                <span>{summary.one_to_one_enrollments} 1:1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-slate-500">Today&apos;s Sessions</div>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                {todayClasses.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {todayClasses.filter((c) => c.status === "ended").length} ended ·{" "}
                {todayClasses.filter((c) => c.status !== "ended" && c.status !== "cancelled").length} upcoming/live
              </div>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <CalendarClock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className={actionCount > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
          <CardContent className="p-4 flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-slate-500">Action Center</div>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                {followupsQ.data?.next_before ? `${actionCount}+` : actionCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {pendingReports.length} reports · {pendingLeaves.length} leaves · {pendingFollowups.length} follow-ups
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Finance & Governance Jump Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => onNavigate("packages-contracts")}>
          Manage 1:1 Packages &amp; Ledger
        </Button>
        {(isAdmin || user.role.startsWith("guardian")) && (
          <Button variant="outline" size="sm" onClick={() => onNavigate("invoices")}>
            Tuition Invoices
          </Button>
        )}
        {(isAdmin || user.role === "zimmadar" || user.role === "teacher") && (
          <Button variant="outline" size="sm" onClick={() => onNavigate("teacher-payables")}>
            Teacher Compensation
          </Button>
        )}
        {user.role === "central_admin" && (
          <Button variant="outline" size="sm" onClick={() => onNavigate("audit")}>
            Inspect Audit Log
          </Button>
        )}
      </div>

      {/* Today's Classes + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s Sessions ({todayStr})</h2>
              <p className="text-xs text-slate-500">Asia/Dhaka schedule</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {todayClasses.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No classes scheduled for today.
              </p>
            ) : (
              todayClasses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {c.course_title}
                      </span>
                      <Badge tone={statusTone(c.status)}>{c.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {c.batch_name} · {formatTimeDhaka(c.scheduled_start)}
                      {c.scheduled_end ? ` – ${formatTimeDhaka(c.scheduled_end)}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.role === "teacher" && c.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => classAction.mutate({ id: c.id, action: "start" })}
                      >
                        <Play className="w-3 h-3" /> Start
                      </Button>
                    )}
                    {user.role === "teacher" && c.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => classAction.mutate({ id: c.id, action: "end" })}
                      >
                        <Square className="w-3 h-3" /> End
                      </Button>
                    )}
                    {(user.role === "zimmadar" || user.role === "central_admin") &&
                      c.status === "ended" &&
                      !c.held_verified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => classAction.mutate({ id: c.id, action: "verify-held" })}
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Verify Held
                        </Button>
                      )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Academic Sessions</h2>
              <p className="text-xs text-slate-500">Latest 10 sessions across your scope</p>
            </div>
            {isAdmin && (
              <a
                href="/api/exports/classes.csv"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </a>
            )}
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-3">Course / Batch</th>
                  <th className="py-2.5 px-3">Start</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-800 tabular-nums">
                      #CLS-{String(c.id).padStart(4, "0")}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{c.course_title}</div>
                      <div className="text-[11px] text-slate-500">{c.batch_name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 tabular-nums">
                      {formatDateTimeDhaka(c.scheduled_start)}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge tone={statusTone(c.status)}>{c.status.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                ))}
                {recentClasses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

