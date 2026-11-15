import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, toArray } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { getDhakaDateString } from '@/lib/utils'
import {
  type AcademyExpense,
  EXPENSE_CATEGORIES,
  EXPENSES_KEY,
  type ExpenseCategory,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  Wallet, Plus, Trash2, Download, TrendingUp, TrendingDown, DollarSign,
} from 'lucide-react'

interface InvoiceMini {
  id: number
  billing_month: string
  amount_due: string | number
  amount_paid: string | number
  status: string
}

interface PayableMini {
  id: number
  billing_month: string
  payable_amount: string | number
}

const DEFAULT_SAMPLE_EXPENSES: AcademyExpense[] = []

export default function ExpensesPage() {
  const today = getDhakaDateString()
  const [selectedMonth, setSelectedMonth] = useState(() => today.slice(0, 7))
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [expenses, setExpenses] = useLocalStore<AcademyExpense[]>(EXPENSES_KEY, DEFAULT_SAMPLE_EXPENSES)
  const toast = useToast()

  // New expense form
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Zoom & LMS Tools')
  const [amount, setAmount] = useState('')
  const [expDate, setExpDate] = useState(today)
  const [method, setMethod] = useState<AcademyExpense['payment_method']>('bKash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const { data: invoices = [], isLoading: li } = useQuery<InvoiceMini[]>({
    queryKey: ['expenses-invoices'],
    queryFn: () => api.get<InvoiceMini[] | { items?: InvoiceMini[] }>('/invoices').then(toArray).catch(() => []),
  })

  const { data: payables = [], isLoading: lp } = useQuery<PayableMini[]>({
    queryKey: ['expenses-payables'],
    queryFn: () =>
      api
        .get<PayableMini[] | { items?: PayableMini[] }>('/finance/teacher-payables')
        .then(toArray)
        .catch(() => []),
  })

  const monthFilteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const mOk = !selectedMonth || e.month === selectedMonth
      const cOk = categoryFilter === 'all' || e.category === categoryFilter
      return mOk && cOk
    })
  }, [expenses, selectedMonth, categoryFilter])

  const pnl = useMemo(() => {
    const invRows = selectedMonth ? invoices.filter((i) => i.billing_month === selectedMonth) : invoices
    const payRows = selectedMonth ? payables.filter((p) => p.billing_month === selectedMonth) : payables
    const expRows = selectedMonth ? expenses.filter((e) => e.month === selectedMonth) : expenses

    const collected = invRows.reduce((s, i) => s + Number(i.amount_paid || 0), 0)
    const billed = invRows.reduce((s, i) => s + Number(i.amount_due || 0), 0)
    const teacherPay = payRows.reduce((s, p) => s + Number(p.payable_amount || 0), 0)
    const operatingExp = expRows.reduce((s, e) => s + Number(e.amount || 0), 0)
    const totalOutflow = teacherPay + operatingExp
    const netProfit = collected - totalOutflow

    const byCategory = EXPENSE_CATEGORIES.map((cat) => {
      const val = expRows.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0)
      return { category: cat, amount: val }
    })

    return { collected, billed, teacherPay, operatingExp, totalOutflow, netProfit, byCategory }
  }, [invoices, payables, expenses, selectedMonth])

  function addExpense(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(amount)
    if (!title.trim() || !num || num <= 0) {
      toast.error(new Error('Enter valid title and positive amount'))
      return
    }
    const row: AcademyExpense = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: num,
      month: expDate.slice(0, 7),
      expense_date: expDate,
      payment_method: method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    }
    setExpenses((prev) => [row, ...prev])
    setTitle('')
    setAmount('')
    setReference('')
    setNotes('')
    toast.success(`Logged expense: ৳${num.toLocaleString()}`)
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    toast.success('Expense entry removed')
  }

  function exportCsv() {
    const header = ['Date', 'Month', 'Title', 'Category', 'Amount (BDT)', 'Method', 'Reference', 'Notes']
    const rows = monthFilteredExpenses.map((e) => [
      e.expense_date,
      e.month,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      String(e.amount),
      e.payment_method,
      `"${(e.reference || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iom-expenses-${selectedMonth || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Expenses CSV downloaded')
  }

  const maxCatAmount = Math.max(1, ...pnl.byCategory.map((c) => c.amount), pnl.teacherPay)

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary-700" /> Academy Expenses & Profit / Loss (P&amp;L)
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Track fixed salaries, Zoom/LMS tools, marketing, and server costs alongside live tuition collections and teacher payables.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-surface"
          />
          {selectedMonth && (
            <Button size="sm" variant="outline" onClick={() => setSelectedMonth('')}>
              All Months
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={monthFilteredExpenses.length === 0}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* P&L KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">Tuition Collected</span>
            <TrendingUp className="w-4 h-4 text-teal-700" />
          </div>
          {li ? (
            <Skeleton className="h-8 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-teal-700 mt-1">৳ {pnl.collected.toLocaleString()}</p>
          )}
          <p className="text-xs text-muted mt-0.5">Out of ৳ {pnl.billed.toLocaleString()} billed</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">Teacher Class Payables</span>
            <DollarSign className="w-4 h-4 text-primary-700" />
          </div>
          {lp ? (
            <Skeleton className="h-8 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-heading mt-1">৳ {pnl.teacherPay.toLocaleString()}</p>
          )}
          <p className="text-xs text-muted mt-0.5">From live class sessions</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">Operating Overheads</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-heading mt-1">৳ {pnl.operatingExp.toLocaleString()}</p>
          <p className="text-xs text-muted mt-0.5">{monthFilteredExpenses.length} expense items</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">Net Operating Profit / Loss</span>
            <Wallet className="w-4 h-4 text-primary-700" />
          </div>
          <p className={`text-2xl font-bold mt-1 ${pnl.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {pnl.netProfit >= 0 ? '+' : '-'}৳ {Math.abs(pnl.netProfit).toLocaleString()}
          </p>
          <p className="text-xs text-muted mt-0.5">
            Total Outflow: ৳ {pnl.totalOutflow.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Add Expense + Category Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary-700" /> Record Academy Expense / Fixed Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
              <Input
                label="Expense Title"
                placeholder="Zoom Workplace Pro / Admin Salary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-heading mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Amount (BDT)"
                type="number"
                min={1}
                placeholder="2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Input
                label="Date"
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-heading mb-1">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as AcademyExpense['payment_method'])}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                >
                  {(['bKash', 'Nagad', 'Bank Transfer', 'Card', 'Cash'] as const).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="TrxID / Voucher Ref"
                placeholder="TRX9912 / Voucher #12"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Notes (Optional)"
                  placeholder="Paid for November billing cycle…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4" /> Log Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outflow Breakdown {selectedMonth ? `(${selectedMonth})` : ''}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-heading">Teacher Class Payables</span>
                <span className="font-bold text-primary-700">৳ {pnl.teacherPay.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-bg overflow-hidden">
                <div
                  className="h-full bg-primary-700 rounded-full"
                  style={{ width: `${Math.round((pnl.teacherPay / maxCatAmount) * 100)}%` }}
                />
              </div>
            </div>
            {pnl.byCategory.map((c) => (
              <div key={c.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-body">{c.category}</span>
                  <span className="font-bold text-heading">৳ {c.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.round((c.amount / maxCatAmount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Expense Ledger Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3 w-full">
            <CardTitle>Expense Ledger ({monthFilteredExpenses.length})</CardTitle>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-bg"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {monthFilteredExpenses.length === 0 ? (
            <p className="text-center text-sm text-muted py-12">
              No operating expenses recorded for {selectedMonth || 'any month'} yet.
            </p>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title &amp; Notes</th>
                  <th>Category</th>
                  <th>Method &amp; Ref</th>
                  <th>Amount</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {monthFilteredExpenses.map((e) => (
                  <tr key={e.id}>
                    <td className="text-xs font-mono">{e.expense_date}</td>
                    <td>
                      <p className="font-semibold text-heading">{e.title}</p>
                      {e.notes && <p className="text-[11px] text-muted">{e.notes}</p>}
                    </td>
                    <td>
                      <Badge variant="secondary">{e.category}</Badge>
                    </td>
                    <td className="text-xs">
                      {e.payment_method} {e.reference ? `· ${e.reference}` : ''}
                    </td>
                    <td className="font-bold text-rose-700">৳ {e.amount.toLocaleString()}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => removeExpense(e.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

