import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Banknote } from "lucide-react";
import {
  apiRequest,
  ApiError,
  type MeUser,
  type TuitionInvoice,
  type EnrollmentRow,
  type OneToOneContract,
} from "@/lib/api";
import { dayKeyDhaka, formatMoney } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/skeleton";

export function InvoicesPage({
  user,
  onNotify,
}: {
  user: MeUser;
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}) {
  const queryClient = useQueryClient();
  const isAdmin = ["central_admin", "branch_admin"].includes(user.role);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<TuitionInvoice | null>(null);

  const invoicesQ = useQuery({
    queryKey: ["invoices", user.role],
    queryFn: () => apiRequest<TuitionInvoice[]>("/invoices"),
  });

  const enrollmentsQ = useQuery({
    queryKey: ["enrollments-for-invoices"],
    queryFn: () => apiRequest<EnrollmentRow[]>("/enrollments"),
    enabled: createOpen && isAdmin,
  });

  const contractsQ = useQuery({
    queryKey: ["contracts-for-invoices"],
    queryFn: () => apiRequest<OneToOneContract[]>("/one-to-one/contracts"),
    enabled: createOpen && isAdmin,
  });

  if (invoicesQ.isLoading) return <PageSkeleton />;

  const invoices = invoicesQ.data || [];
  const filtered = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const hay = `${inv.invoice_number} ${inv.student_name} ${inv.course_title} ${inv.payment_reference_code || ""}`.toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });

  const totalBilled = invoices.reduce((s, i) => s + Number(i.amount_due || 0), 0);
  const totalCollected = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;
  const collectedPct = totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-xs text-sky-900">
        <b>External Payment Governance (D-011 / D-015 / D-141):</b> Payment collection remains
        external. Administrators record verified external transaction references against generated
        invoices here.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Total Collected</div>
            <div className="text-2xl font-extrabold text-teal-700 tabular-nums mt-1">
              {formatMoney(totalCollected)}
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${collectedPct}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Outstanding Due</div>
            <div className="text-2xl font-extrabold text-amber-600 tabular-nums mt-1">
              {formatMoney(Math.max(0, totalBilled - totalCollected))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Paid Invoices</div>
            <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
              {paidCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500">Unpaid Invoices</div>
            <div className="text-2xl font-extrabold text-rose-600 tabular-nums mt-1">
              {unpaidCount}
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
                placeholder="Search invoice #, learner, TxID..."
                className="pl-8 w-56 h-8 text-xs"
              />
            </div>
            <Select
              aria-label="Filter invoices by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40 h-8 text-xs"
            >
              <option value="">All Invoices</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
            </Select>
          </div>
          {isAdmin && (
            <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Create Invoice
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-3">Learner</th>
                <th className="py-2.5 px-3">Course / Batch</th>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Due</th>
                <th className="py-2.5 px-3">Paid</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">{inv.student_name}</td>
                  <td className="py-3 px-3">
                    <div>{inv.course_title}</div>
                    <div className="text-[11px] text-slate-500">{inv.batch_name}</div>
                  </td>
                  <td className="py-3 px-3 tabular-nums">{inv.billing_month}</td>
                  <td className="py-3 px-3 font-bold tabular-nums">{formatMoney(inv.amount_due)}</td>
                  <td className="py-3 px-3 font-bold text-teal-700 tabular-nums">
                    {formatMoney(inv.amount_paid)}
                  </td>
                  <td className="py-3 px-3">
                    <Badge tone={statusTone(inv.status)}>{inv.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    {inv.payment_reference_code || "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isAdmin && inv.status !== "paid" ? (
                      <Button size="sm" variant="outline" onClick={() => setPayInvoice(inv)}>
                        <Banknote className="w-3.5 h-3.5" /> Record Payment
                      </Button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No tuition invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        enrollments={enrollmentsQ.data || []}
        contracts={contractsQ.data || []}
        onCreated={() => {
          setCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          onNotify("Invoice generated.");
        }}
      />

      <RecordPaymentDialog
        invoice={payInvoice}
        onClose={() => setPayInvoice(null)}
        onRecorded={() => {
          setPayInvoice(null);
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          onNotify("Payment recorded.");
        }}
      />
    </div>
  );
}

function CreateInvoiceDialog({
  open,
  onOpenChange,
  enrollments,
  contracts,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  enrollments: EnrollmentRow[];
  contracts: OneToOneContract[];
  onCreated: () => void;
}) {
  const today = dayKeyDhaka(new Date());
  const [enrollmentId, setEnrollmentId] = useState("");
  const [contractId, setContractId] = useState("");
  const [billingMonth, setBillingMonth] = useState(today.slice(0, 7));
  const [amountDue, setAmountDue] = useState("2500");
  const [dueDate, setDueDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const selectedEnrollmentId = enrollmentId || String(enrollments[0]?.id || "");
  const matchingContracts = contracts.filter(
    (c) => String(c.enrollment_id) === selectedEnrollmentId,
  );

  const mut = useMutation({
    mutationFn: () =>
      apiRequest("/invoices", {
        method: "POST",
        body: {
          enrollment_id: Number(selectedEnrollmentId),
          contract_id: contractId ? Number(contractId) : undefined,
          billing_month: billingMonth,
          amount_due: Number(amountDue),
          due_date: dueDate,
          notes: notes || undefined,
        },
      }),
    onSuccess: () => {
      setError(null);
      setFields({});
      setNotes("");
      onCreated();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fields || {});
      } else {
        setError("Failed to create invoice");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Create Tuition Invoice">
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
          <FormField label="Student Enrollment" error={fields.enrollment_id}>
            <Select
              required
              value={selectedEnrollmentId}
              onChange={(e) => {
                setEnrollmentId(e.target.value);
                setContractId("");
              }}
              hasError={Boolean(fields.enrollment_id)}
            >
              {enrollments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.student_name} — {e.course_title} / {e.batch_name}
                </option>
              ))}
            </Select>
          </FormField>

          {matchingContracts.length > 0 && (
            <FormField label="Linked 1:1 Contract (Optional)" error={fields.contract_id}>
              <Select value={contractId} onChange={(e) => setContractId(e.target.value)}>
                <option value="">None</option>
                {matchingContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} — {c.package_name} ({c.billing_period})
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Billing Month" error={fields.billing_month}>
              <Input
                required
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                hasError={Boolean(fields.billing_month)}
                placeholder="2026-11"
              />
            </FormField>
            <FormField label="Amount Due (BDT)" error={fields.amount_due}>
              <Input
                type="number"
                required
                min={1}
                step="0.01"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                hasError={Boolean(fields.amount_due)}
              />
            </FormField>
            <FormField label="Due Date" error={fields.due_date}>
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                hasError={Boolean(fields.due_date)}
              />
            </FormField>
          </div>
          <FormField label="Notes (Optional)" error={fields.notes}>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mut.isPending || !selectedEnrollmentId}>
              {mut.isPending ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentDialog({
  invoice,
  onClose,
  onRecorded,
}: {
  invoice: TuitionInvoice | null;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [refCode, setRefCode] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const remaining = invoice ? Math.max(0, Number(invoice.amount_due) - Number(invoice.amount_paid)) : 0;
  const effectiveAmount = amountPaid || String(remaining || "");

  const mut = useMutation({
    mutationFn: () =>
      apiRequest(`/invoices/${invoice!.id}/record-payment`, {
        method: "POST",
        body: {
          payment_reference_code: refCode,
          amount_paid: Number(effectiveAmount),
        },
      }),
    onSuccess: () => {
      setError(null);
      setFields({});
      setRefCode("");
      setAmountPaid("");
      onRecorded();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setError(e.message);
        setFields(e.fields || {});
      } else {
        setError("Payment update failed");
      }
    },
  });

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Record External Payment"
        description={invoice ? `${invoice.invoice_number} · ${invoice.student_name}` : undefined}
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
          <FormField label="External Transaction Reference (TxID)" error={fields.payment_reference_code}>
            <Input
              required
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              hasError={Boolean(fields.payment_reference_code)}
              placeholder="TRX-BKASH-XXXXX"
            />
          </FormField>
          <FormField label="Amount Paid (BDT)" error={fields.amount_paid}>
            <Input
              type="number"
              required
              min={1}
              step="0.01"
              value={effectiveAmount}
              onChange={(e) => setAmountPaid(e.target.value)}
              hasError={Boolean(fields.amount_paid)}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={mut.isPending}>
              {mut.isPending ? "Recording..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

