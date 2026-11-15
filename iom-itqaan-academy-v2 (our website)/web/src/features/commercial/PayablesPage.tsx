import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Search } from "lucide-react";
import {
  apiRequest,
  ApiError,
  type MeUser,
  type TeacherPayable,
  type ClassSessionRow,
} from "@/lib/api";
import { formatDateTimeDhaka, formatMoney } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/skeleton";

export function PayablesPage({
  user,
  onNotify,
}: {
  user: MeUser;
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}) {
  const queryClient = useQueryClient();
  const canCalculate = ["central_admin", "branch_admin", "zimmadar"].includes(user.role);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [calcOpen, setCalcOpen] = useState(false);

  const payablesQ = useQuery({
    queryKey: ["teacher-payables", period, user.role],
    queryFn: () =>
      apiRequest<TeacherPayable[]>(
        "/finance/teacher-payables" +
          (period ? `?billing_period=${encodeURIComponent(period)}` : ""),
      ),
  });

  const endedClassesQ = useQuery({
    queryKey: ["ended-classes-for-payables"],
    queryFn: () => apiRequest<ClassSessionRow[]>("/classes?status=ended&limit=200"),
    enabled: calcOpen && canCalculate,
  });

  if (payablesQ.isLoading) return <PageSkeleton />;

  const list = payablesQ.data || [];
  const filtered = list.filter((p) => {
    if (!search.trim()) return true;
    const hay = `${p.teacher_name || ""} ${p.teacher_email || ""} ${p.course_title || ""} ${p.billing_month} ${p.class_session_id}`.toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });

  const totalPayable = list.reduce((s, p) => s + Number(p.payable_amount || 0), 0);
  const totalMins = list.reduce((s, p) => s + Number(p.conducted_minutes || 0), 0);
  const verifiedCount = list.filter((p) => p.status === "verified").length;
  const pendingCount = list.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Total Compensation</div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
              {formatMoney(totalPayable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Conducted Hours</div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
              {Math.floor(totalMins / 60)}h {totalMins % 60}m
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Verified Sessions</div>
            <div className="text-2xl font-extrabold text-teal-700 tabular-nums mt-1">
              {verifiedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Pending Verification</div>
            <div className="text-2xl font-extrabold text-amber-600 tabular-nums mt-1">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                data-search-input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teacher, class ID..."
                className="pl-8 w-56 h-8 text-xs"
              />
            </div>
            <Input
              type="month"
              aria-label="Filter by billing month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40 h-8 text-xs"
            />
            {period && (
              <Button size="sm" variant="ghost" onClick={() => setPeriod("")}>
                Clear Month
              </Button>
            )}
          </div>
          {canCalculate && (
            <Button size="sm" variant="primary" onClick={() => setCalcOpen(true)}>
              <Calculator className="w-3.5 h-3.5" /> Calculate Session Payable
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Teacher</th>
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Hourly Rate</th>
                <th className="py-2.5 px-3">Payable</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4">Calculated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">
                      {p.teacher_name || `Staff #${p.teacher_id}`}
                    </div>
                    <div className="text-[11px] text-slate-500">{p.teacher_email || ""}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold tabular-nums">
                      #CLS-{String(p.class_session_id).padStart(4, "0")}
                    </div>
                    <div className="text-[11px] text-slate-500">{p.course_title || ""}</div>
                  </td>
                  <td className="py-3 px-3 tabular-nums">{p.billing_month}</td>
                  <td className="py-3 px-3 tabular-nums">{p.conducted_minutes} mins</td>
                  <td className="py-3 px-3 font-semibold tabular-nums">
                    {formatMoney(p.hourly_rate, "৳/hr")}
                  </td>
                  <td className="py-3 px-3 font-bold text-teal-700 tabular-nums">
                    {formatMoney(p.payable_amount)}
                  </td>
                  <td className="py-3 px-3">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">
                    {formatDateTimeDhaka(p.calculated_at)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No payable records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <CalculatePayableDialog
        open={calcOpen}
        onOpenChange={setCalcOpen}
        classes={endedClassesQ.data || []}
        onCalculated={() => {
          setCalcOpen(false);
          queryClient.invalidateQueries({ queryKey: ["teacher-payables"] });
          onNotify("Session payable calculated.");
        }}
      />
    </div>
  );
}

function CalculatePayableDialog({
  open,
  onOpenChange,
  classes,
  onCalculated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  classes: ClassSessionRow[];
  onCalculated: () => void;
}) {
  const [classId, setClassId] = useState("");
  const [hourlyRate, setHourlyRate] = useState("400");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const selectedClassId = classId || String(classes[0]?.id || "");

  const mut = useMutation({
    mutationFn: () =>
      apiRequest("/finance/teacher-payables/calculate", {
        method: "POST",
        body: {
          class_session_id: Number(selectedClassId),
          hourly_rate: Number(hourlyRate),
        },
      }),
    onSuccess: () => {
      setError(null);
      setFields({});
      onCalculated();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fields || {});
      } else {
        setError("Calculation failed");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Calculate Teacher Session Payable">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
          <FormField label="Ended Class Session" error={fields.class_session_id}>
            <Select
              required
              value={selectedClassId}
              onChange={(e) => setClassId(e.target.value)}
              hasError={Boolean(fields.class_session_id)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  #CLS-{String(c.id).padStart(4, "0")} — {c.course_title} ({c.batch_name})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Teacher Hourly Rate (BDT)" error={fields.hourly_rate}>
            <Input
              type="number"
              required
              min={100}
              step="10"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              hasError={Boolean(fields.hourly_rate)}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mut.isPending || !selectedClassId}>
              {mut.isPending ? "Calculating..." : "Calculate Payable"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

