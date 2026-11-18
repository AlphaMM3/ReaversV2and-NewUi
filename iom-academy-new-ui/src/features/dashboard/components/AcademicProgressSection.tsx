import { SparkAreaChart, HorizontalBarList, ChartTableCard } from '../DashboardCharts'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight, BookOpen } from 'lucide-react'
import type { AssessmentMini, ResourceMini, AnnouncementMini } from '../types'

interface Props {
  monthKey: string
  attendanceAvgPct: number | null
  courseRates: Array<{ label: string; pct: number; held: number }>
  studentsByCourse: Array<{ label: string; value: number; displayValue: string; color: string }>
  assessments: AssessmentMini[]
  resources: ResourceMini[]
  announcements: AnnouncementMini[]
  onNavigate: (route: string) => void
}

export default function AcademicProgressSection({
  monthKey,
  attendanceAvgPct,
  courseRates,
  studentsByCourse,
  assessments,
  resources,
  announcements,
  onNavigate,
}: Props) {
  const publishedAssessments = assessments.filter((a) => a.published).length

  return (
    <div className="space-y-5">
      {/* 2 Interactive Charts: Attendance Trend & Batch Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartTableCard
          title="শিক্ষার্থী উপস্থিতি ও পারসেন্টেজ"
          subtitle={`অনলাইন ভেরিফাইড ক্লাস উপস্থিতি (${monthKey}) · গড় ${attendanceAvgPct ?? '—'}%`}
          isEmpty={courseRates.length === 0}
          emptyMessage="চলতি মাসের জন্য এখনো কোনো ক্লাস শেষ ও ভেরিফাই হয়নি।"
          chart={
            <SparkAreaChart
              points={courseRates.slice(0, 8).map((c) => ({
                label: c.label.split(' · ')[0].slice(0, 14),
                value: c.pct,
              }))}
              stroke="#0d9488"
              fill="rgba(13, 148, 136, 0.12)"
              suffix="%"
            />
          }
          table={
            <table className="iom-table">
              <thead><tr><th>কোর্স ও ব্যাচ</th><th>অনুষ্ঠিত ক্লাস</th><th>উপস্থিতি %</th></tr></thead>
              <tbody>
                {courseRates.map((r, idx) => (
                  <tr key={`${r.label}-${idx}`}>
                    <td className="text-xs font-semibold">{r.label}</td>
                    <td className="text-xs">{r.held}</td>
                    <td className="text-xs font-bold text-teal-700">{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />

        <ChartTableCard
          title="কোর্স ও ব্যাচভিত্তিক শিক্ষার্থী বন্টন"
          subtitle="সক্রিয় এনরোলমেন্টের অনুপাত"
          isEmpty={studentsByCourse.length === 0}
          emptyMessage="কোনো সক্রিয় শিক্ষার্থী নথিভুক্ত নেই।"
          chart={<HorizontalBarList items={studentsByCourse} />}
          table={
            <table className="iom-table">
              <thead><tr><th>কোর্স / ব্যাচ</th><th>সক্রিয় শিক্ষার্থী</th></tr></thead>
              <tbody>
                {studentsByCourse.map((s, idx) => (
                  <tr key={`${s.label}-${idx}`}>
                    <td className="text-xs font-semibold">{s.label}</td>
                    <td className="text-xs font-bold">{s.displayValue} জন</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
      </div>

      {/* Curriculum, Assessments and Vault Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-slate-200/90 p-4 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">অনলাইন মূল্যায়ন ও পরীক্ষা</span>
            <Badge variant="approved">{publishedAssessments} প্রকাশিত</Badge>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-heading">{assessments.length} টি পরীক্ষা</p>
            <p className="text-xs text-muted mt-0.5">মাসিক ও সাপ্তাহিক মূল্যায়ন ট্র্যাকড</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('#/exams')}
            className="text-xs font-semibold text-primary-700 hover:underline pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer"
          >
            <span>পরীক্ষা ও নম্বরপত্র</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/90 p-4 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">ডিজিটাল কুতুবখানা ও রিসোর্স</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-heading">{resources.length} টি ফাইল</p>
            <p className="text-xs text-muted mt-0.5">পিডিএফ কিতাব, কায়েদা ও শিট</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('#/resources')}
            className="text-xs font-semibold text-primary-700 hover:underline pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer"
          >
            <span>রিসোর্স সেন্টার</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/90 p-4 shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">অ্যাকাডেমিক নোটিশ ও ঘোষণা</span>
            <Badge variant="neutral">{announcements.length} নোটিশ</Badge>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-heading">{announcements.length > 0 ? announcements[0].title.slice(0, 20) + '...' : 'সকল নোটিশ আপডেট'}</p>
            <p className="text-xs text-muted mt-0.5">শিক্ষক ও অভিভাবক টেলিগ্রাম চ্যানেলে যুক্ত</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('#/communications')}
            className="text-xs font-semibold text-primary-700 hover:underline pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer"
          >
            <span>যোগাযোগ বোর্ড</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
