import { Wallet, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ChartTableCard, DualBarChart } from '../DashboardCharts'

interface Props {
  monthKey: string
  trendPeriod: '6m' | '12m'
  setTrendPeriod: (p: '6m' | '12m') => void
  feeMonthlySeries: Array<{ ym: string; label: string; primary: number; secondary: number }>
  cashflowSeries: Array<{ ym: string; label: string; primary: number; secondary: number }>
  monthCollected: number
  monthBilled: number
  monthCollectionPct: number
  monthPayablesTotal: number
  monthOperatingExpenses: number
  pendingPayablesSum: number
  pendingPayablesCount: number
  onNavigate: (route: string) => void
}

export default function FinanceOverviewSection({
  monthKey,
  trendPeriod,
  setTrendPeriod,
  feeMonthlySeries,
  cashflowSeries,
  monthCollected,
  monthBilled,
  monthCollectionPct,
  monthPayablesTotal,
  monthOperatingExpenses,
  pendingPayablesSum,
  pendingPayablesCount,
  onNavigate,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Financial Health Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-slate-200/90 p-4 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">মাসিক আদায় ও লক্ষ্যমাত্রা</span>
            <Badge variant={monthCollectionPct >= 80 ? 'approved' : 'pending'}>{monthCollectionPct}%</Badge>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-heading">৳ {monthCollected.toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5">মোট বিল ৳ {monthBilled.toLocaleString()} ({monthKey})</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('#/invoices')}
            className="text-xs font-semibold text-primary-700 hover:underline pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer"
          >
            <span>ইনভয়েস খাতা দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/90 p-4 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">শিক্ষক বেতন ও অনারিয়াম</span>
            <Badge variant={pendingPayablesCount > 0 ? 'pending' : 'approved'}>
              {pendingPayablesCount} স্লিপ বকেয়া
            </Badge>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-heading">৳ {monthPayablesTotal.toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5">বকেয়া বেতন ৳ {pendingPayablesSum.toLocaleString()}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('#/payables')}
            className="text-xs font-semibold text-primary-700 hover:underline pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer"
          >
            <span>বেতন রেজিস্টার</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/90 p-4 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">নিট উদ্বৃত্ত ও তহবিল (P&amp;L)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-emerald-700">
              ৳ {(monthCollected - monthPayablesTotal - monthOperatingExpenses).toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-0.5">অ্যাকাডেমি পরিচালনা ব্যয় ৳ {monthOperatingExpenses.toLocaleString()}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('#/expenses')}
            className="text-xs font-semibold text-primary-700 hover:underline pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer"
          >
            <span>ব্যয় ভাউচার ও খতিয়ান</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dual Bar Charts: Tuition Trend & Cashflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartTableCard
          title="মাসিক টিউশন ফি আদায়ের ট্রেন্ড"
          subtitle={`বিল্ড বনাম সংগৃহীত ফি (${trendPeriod})`}
          headerAction={
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-border/80">
              <button
                type="button"
                onClick={() => setTrendPeriod('6m')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  trendPeriod === '6m' ? 'bg-white text-primary-700 shadow-3xs' : 'text-muted'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setTrendPeriod('12m')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  trendPeriod === '12m' ? 'bg-white text-primary-700 shadow-3xs' : 'text-muted'
                }`}
              >
                12M
              </button>
            </div>
          }
          chart={
            <DualBarChart
              data={feeMonthlySeries}
              primaryLabel="মোট বিল"
              secondaryLabel="আদায়"
              primaryColor="#0f3e32"
              secondaryColor="#059669"
            />
          }
          table={
            <table className="iom-table">
              <thead><tr><th>মাস</th><th>মোট বিল</th><th>আদায়</th></tr></thead>
              <tbody>
                {feeMonthlySeries.map((row) => (
                  <tr key={row.ym}>
                    <td className="font-semibold text-xs">{row.label}</td>
                    <td className="text-xs">৳ {row.primary.toLocaleString()}</td>
                    <td className="text-xs font-bold text-emerald-700">৳ {row.secondary.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />

        <ChartTableCard
          title="ক্যাশফ্লো সামারি ও নেট ব্যালেন্স"
          subtitle={`ফি আদায় বনাম শিক্ষক বেতন (${trendPeriod})`}
          chart={
            <DualBarChart
              data={cashflowSeries}
              primaryLabel="সংগৃহীত ফি"
              secondaryLabel="শিক্ষক বেতন"
              primaryColor="#059669"
              secondaryColor="#4f46e5"
            />
          }
          table={
            <table className="iom-table">
              <thead><tr><th>মাস</th><th>আদায়</th><th>বেতন পরিশোধ</th></tr></thead>
              <tbody>
                {cashflowSeries.map((row) => (
                  <tr key={row.ym}>
                    <td className="font-semibold text-xs">{row.label}</td>
                    <td className="text-xs font-bold text-emerald-700">৳ {row.primary.toLocaleString()}</td>
                    <td className="text-xs text-indigo-700 font-semibold">৳ {row.secondary.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
      </div>
    </div>
  )
}
