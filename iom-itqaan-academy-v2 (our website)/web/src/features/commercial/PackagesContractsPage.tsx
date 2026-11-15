import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, History, SlidersHorizontal, Search } from "lucide-react";
import {
  apiRequest,
  ApiError,
  type MeUser,
  type CommercialPackage,
  type OneToOneContract,
  type LedgerEntry,
  type EnrollmentRow,
} from "@/lib/api";
import { dayKeyDhaka, formatDateTimeDhaka, formatMoney, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { PageSkeleton } from "@/components/ui/skeleton";

export function PackagesContractsPage({
  user,
  onNotify,
}: {
  user: MeUser;
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}) {
  const queryClient = useQueryClient();
  const isAdmin = ["central_admin", "branch_admin"].includes(user.role);
  const canManage = isAdmin || user.role === "zimmadar";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");

  const [ledgerContract, setLedgerContract] = useState<OneToOneContract | null>(null);
  const [newPkgOpen, setNewPkgOpen] = useState(false);
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [adjustContract, setAdjustContract] = useState<OneToOneContract | null>(null);

  const contractsQ = useQuery({
    queryKey: ["contracts", periodFilter, user.role],
    queryFn: () =>
      apiRequest<OneToOneContract[]>(
        "/one-to-one/contracts" +
          (periodFilter ? `?billing_period=${encodeURIComponent(periodFilter)}` : ""),
      ),
  });

  const packagesQ = useQuery({
    queryKey: ["packages", user.role],
    queryFn: () => apiRequest<CommercialPackage[]>("/one-to-one/packages"),
  });

  const ledgerQ = useQuery({
    queryKey: ["contract-ledger", ledgerContract?.id],
    queryFn: () =>
      apiRequest<LedgerEntry[]>(`/one-to-one/contracts/${ledgerContract!.id}/ledger`),
    enabled: Boolean(ledgerContract),
  });

  const enrollmentsQ = useQuery({
    queryKey: ["enrollments-for-contracts"],
    queryFn: () => apiRequest<EnrollmentRow[]>("/enrollments"),
    enabled: newContractOpen,
  });

  const contracts = contractsQ.data || [];
  const packages = packagesQ.data || [];

  const filteredContracts = contracts.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const hay = `${c.student_name} ${c.package_name} ${c.batch_name || ""} ${c.billing_period}`.toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });

  const activeCount = contracts.filter((c) => c.status === "active").length;
  const totalAllocated = contracts.reduce((s, c) => s + (c.allocated_minutes || 0), 0);
  const totalRemaining = contracts.reduce((s, c) => s + (c.remaining_minutes || 0), 0);

  if (contractsQ.isLoading && packagesQ.isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-xs text-teal-900">
        <b>AM-18 / 1:1 Commercial Ledger:</b> Package minutes deduct automatically per verified
        session. Manual adjustments require an audit reason and are recorded against the actor ID.
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Active 1:1 Contracts</div>
            <div className="text-2xl font-extrabold text-teal-700 tabular-nums mt-1">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Packages in Catalog</div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
              {packages.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Allocated Hours</div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
              {Math.round(totalAllocated / 60)}h
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Remaining Balance</div>
            <div
              className={cn(
                "text-2xl font-extrabold tabular-nums mt-1",
                totalRemaining < 60 ? "text-amber-600" : "text-slate-900",
              )}
            >
              {Math.round(totalRemaining / 60)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Actions Bar */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                data-search-input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search learner, package..."
                className="pl-8 w-56 h-8 text-xs"
              />
            </div>
            <Select
              aria-label="Filter by contract status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40 h-8 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="depleted">Depleted</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Input
              type="month"
              aria-label="Filter by billing period"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-40 h-8 text-xs"
            />
            {periodFilter && (
              <Button size="sm" variant="ghost" onClick={() => setPeriodFilter("")}>
                Clear Month
              </Button>
            )}
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => setNewContractOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> New 1:1 Contract
              </Button>
              {user.role === "central_admin" && (
                <Button size="sm" variant="outline" onClick={() => setNewPkgOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> New Package
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Learner</th>
                <th className="py-2.5 px-3">Package / Batch</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 w-48">Minutes Utilization</th>
                <th className="py-2.5 px-3">Fee</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.map((c) => {
                const pct =
                  c.allocated_minutes > 0
                    ? Math.min(100, Math.max(0, Math.round((c.used_minutes / c.allocated_minutes) * 100)))
                    : 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.student_name}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{c.package_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.batch_name || c.course_title || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-3 tabular-nums text-slate-600">{c.billing_period}</td>
                    <td className="py-3 px-3">
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct >= 90 ? "bg-rose-600" : pct >= 70 ? "bg-amber-500" : "bg-teal-600",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                        <span>{c.used_minutes}m used</span>
                        <span className="font-semibold text-slate-700">{c.remaining_minutes}m left</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 tabular-nums">
                      {formatMoney(c.fee_amount, c.currency || "BDT")}
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setLedgerContract(c)}>
                          <History className="w-3.5 h-3.5" /> Ledger
                        </Button>
                        {canManage && (
                          <Button size="sm" variant="ghost" onClick={() => setAdjustContract(c)}>
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching 1:1 contracts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Package Catalog */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-bold text-slate-900">1:1 Package Catalog</h2>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Package</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Classes</th>
                <th className="py-2.5 px-3">Minutes</th>
                <th className="py-2.5 px-3">Fee</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{p.code}</td>
                  <td className="py-2.5 px-3 tabular-nums">{p.total_classes}</td>
                  <td className="py-2.5 px-3 tabular-nums">{p.total_minutes}m</td>
                  <td className="py-2.5 px-3 font-bold tabular-nums">
                    {formatMoney(p.fee_amount, p.currency || "BDT")}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge tone={p.active ? "success" : "neutral"}>
                      {p.active ? "active" : "inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Slide-Over Minute Ledger Sheet */}
      <Sheet
        open={Boolean(ledgerContract)}
        onOpenChange={(o) => !o && setLedgerContract(null)}
        title={
          ledgerContract ? `Minute Ledger · #${ledgerContract.id}` : "Minute Ledger"
        }
        subtitle={
          ledgerContract
            ? `${ledgerContract.student_name} · ${ledgerContract.package_name}`
            : undefined
        }
      >
        {ledgerQ.isLoading ? (
          <p className="text-xs text-slate-500">Loading ledger entries...</p>
        ) : ledgerQ.isError ? (
          <p className="text-xs text-rose-600">{(ledgerQ.error as Error).message}</p>
        ) : (
          <div className="space-y-3">
            {(ledgerQ.data || []).map((entry) => {
              const credit = entry.minutes > 0;
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 p-3 flex items-start justify-between gap-3 bg-white"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 capitalize">
                      {entry.entry_type.replaceAll("_", " ")}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatDateTimeDhaka(entry.recorded_at)} ·{" "}
                      {entry.recorded_by_name || `Staff #${entry.recorded_by}`}
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-slate-700 mt-1 italic">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={cn(
                        "text-sm font-extrabold tabular-nums",
                        credit ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {credit ? "+" : ""}
                      {entry.minutes}m
                    </div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      Bal: <b>{entry.balance_after}m</b>
                    </div>
                  </div>
                </div>
              );
            })}
            {(ledgerQ.data || []).length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No ledger history yet.</p>
            )}
          </div>
        )}
      </Sheet>

      {/* New Package Modal */}
      <PackageFormDialog
        open={newPkgOpen}
        onOpenChange={setNewPkgOpen}
        onCreated={() => {
          setNewPkgOpen(false);
          queryClient.invalidateQueries({ queryKey: ["packages"] });
          onNotify("Package created.");
        }}
      />

      {/* New Contract Modal */}
      <ContractFormDialog
        open={newContractOpen}
        onOpenChange={setNewContractOpen}
        enrollments={enrollmentsQ.data || []}
        packages={packages}
        onCreated={() => {
          setNewContractOpen(false);
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
          onNotify("1:1 Contract activated.");
        }}
      />

      {/* Adjust Minutes Modal */}
      <AdjustMinutesDialog
        contract={adjustContract}
        onClose={() => setAdjustContract(null)}
        onAdjusted={() => {
          const cid = adjustContract?.id;
          setAdjustContract(null);
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
          if (cid) queryClient.invalidateQueries({ queryKey: ["contract-ledger", cid] });
          onNotify("Contract minutes adjusted.");
        }}
      />
    </div>
  );
}

function PackageFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [totalClasses, setTotalClasses] = useState("8");
  const [totalMinutes, setTotalMinutes] = useState("360");
  const [feeAmount, setFeeAmount] = useState("5000");
  const [validityDays, setValidityDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: () =>
      apiRequest("/one-to-one/packages", {
        method: "POST",
        body: {
          name,
          code,
          total_classes: Number(totalClasses),
          total_minutes: Number(totalMinutes),
          fee_amount: Number(feeAmount),
          currency: "BDT",
          validity_days: Number(validityDays),
        },
      }),
    onSuccess: () => {
      setError(null);
      setFields({});
      setName("");
      setCode("");
      onCreated();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fields || {});
      } else {
        setError("Failed to create package");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Create 1:1 Package">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Package Name" error={fields.name}>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                hasError={Boolean(fields.name)}
                placeholder="Solo 8 Classes"
              />
            </FormField>
            <FormField label="Code" error={fields.code}>
              <Input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                hasError={Boolean(fields.code)}
                placeholder="SOLO-8"
              />
            </FormField>
            <FormField label="Total Classes" error={fields.total_classes}>
              <Input
                type="number"
                required
                min={1}
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                hasError={Boolean(fields.total_classes)}
              />
            </FormField>
            <FormField label="Total Minutes" error={fields.total_minutes}>
              <Input
                type="number"
                required
                min={1}
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(e.target.value)}
                hasError={Boolean(fields.total_minutes)}
              />
            </FormField>
            <FormField label="Fee Amount (BDT)" error={fields.fee_amount}>
              <Input
                type="number"
                required
                min={1}
                step="0.01"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                hasError={Boolean(fields.fee_amount)}
              />
            </FormField>
            <FormField label="Validity Days" error={fields.validity_days}>
              <Input
                type="number"
                required
                min={1}
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                hasError={Boolean(fields.validity_days)}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : "Create Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContractFormDialog({
  open,
  onOpenChange,
  enrollments,
  packages,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  enrollments: EnrollmentRow[];
  packages: CommercialPackage[];
  onCreated: () => void;
}) {
  const today = dayKeyDhaka(new Date());
  const oneToOne = enrollments.filter((e) => e.delivery_mode === "one_to_one");
  const enList = oneToOne.length ? oneToOne : enrollments;

  const [enrollmentId, setEnrollmentId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [billingPeriod, setBillingPeriod] = useState(today.slice(0, 7));
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const selectedEnrollmentId = enrollmentId || String(enList[0]?.id || "");
  const selectedPackageId = packageId || String(packages[0]?.id || "");

  const mut = useMutation({
    mutationFn: () =>
      apiRequest("/one-to-one/contracts", {
        method: "POST",
        body: {
          enrollment_id: Number(selectedEnrollmentId),
          package_id: Number(selectedPackageId),
          billing_period: billingPeriod,
          start_date: startDate,
          end_date: endDate,
        },
      }),
    onSuccess: () => {
      setError(null);
      setFields({});
      onCreated();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fields || {});
      } else {
        setError("Failed to create contract");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Activate 1:1 Learner Contract">
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
          <FormField label="1:1 Student Enrollment" error={fields.enrollment_id}>
            <Select
              required
              value={selectedEnrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              hasError={Boolean(fields.enrollment_id)}
            >
              {enList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.student_name} — {e.course_title} / {e.batch_name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Package" error={fields.package_id}>
            <Select
              required
              value={selectedPackageId}
              onChange={(e) => setPackageId(e.target.value)}
              hasError={Boolean(fields.package_id)}
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.total_classes} classes, {p.total_minutes}m, {p.fee_amount} ৳)
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Billing Period (YYYY-MM)" error={fields.billing_period}>
              <Input
                required
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                hasError={Boolean(fields.billing_period)}
                placeholder="2026-11"
              />
            </FormField>
            <FormField label="Start Date" error={fields.start_date}>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                hasError={Boolean(fields.start_date)}
              />
            </FormField>
            <FormField label="End Date" error={fields.end_date}>
              <Input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                hasError={Boolean(fields.end_date)}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mut.isPending || !selectedEnrollmentId}>
              {mut.isPending ? "Activating..." : "Activate Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdjustMinutesDialog({
  contract,
  onClose,
  onAdjusted,
}: {
  contract: OneToOneContract | null;
  onClose: () => void;
  onAdjusted: () => void;
}) {
  const [entryType, setEntryType] = useState("rollover_credit");
  const [minutes, setMinutes] = useState("45");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: () =>
      apiRequest(`/one-to-one/contracts/${contract!.id}/adjust`, {
        method: "POST",
        body: { entry_type: entryType, minutes: Number(minutes), notes },
      }),
    onSuccess: () => {
      setError(null);
      setFields({});
      setNotes("");
      onAdjusted();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fields || {});
      } else {
        setError("Adjustment failed");
      }
    },
  });

  return (
    <Dialog open={Boolean(contract)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Adjust Contract Minutes"
        description={contract ? `${contract.student_name} · Balance: ${contract.remaining_minutes}m` : undefined}
      >
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
          <FormField label="Adjustment Type" error={fields.entry_type}>
            <Select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
              <option value="rollover_credit">Rollover Credit (+)</option>
              <option value="reversal_adjustment">Correction / Reversal (+/-)</option>
            </Select>
          </FormField>
          <FormField label="Minutes (+ to add, - to deduct)" error={fields.minutes}>
            <Input
              type="number"
              required
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              hasError={Boolean(fields.minutes)}
            />
          </FormField>
          <FormField label="Audit Reason / Notes" error={fields.notes}>
            <Textarea
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              hasError={Boolean(fields.notes)}
              placeholder="Explain why minutes are adjusted..."
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mut.isPending}>
              {mut.isPending ? "Applying..." : "Apply Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

