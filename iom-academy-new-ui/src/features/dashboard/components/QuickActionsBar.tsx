import {
  Video,
  ClipboardCheck,
  FileText,
  CalendarOff,
  Users,
  UserPlus,
  Receipt,
  MessageCircle,
} from 'lucide-react'

interface Props {
  onNavigate: (route: string) => void
}

export default function QuickActionsBar({ onNavigate }: Props) {
  const actions = [
    { label: 'আজকের ক্লাস', sub: "Today's Classes", icon: Video, route: '#/classes', bg: 'hover:border-primary-300' },
    { label: 'হাজিরা খাতা', sub: 'Attendance', icon: ClipboardCheck, route: '#/attendance', bg: 'hover:border-teal-300' },
    { label: 'ক্লাস রিপোর্ট', sub: 'Class Reports', icon: FileText, route: '#/reports', bg: 'hover:border-orange-300' },
    { label: 'ছুটির আবেদন', sub: 'Leave Queue', icon: CalendarOff, route: '#/leaves', bg: 'hover:border-amber-300' },
    { label: 'শিক্ষার্থীবৃন্দ', sub: 'Student 360', icon: Users, route: '#/students', bg: 'hover:border-emerald-300' },
    { label: 'ভর্তি সেল', sub: 'Admissions', icon: UserPlus, route: '#/admissions', bg: 'hover:border-indigo-300' },
    { label: 'ফি ও ইনভয়েস', sub: 'Invoices', icon: Receipt, route: '#/invoices', bg: 'hover:border-rose-300' },
    { label: 'যোগাযোগ ও নোটিশ', sub: 'Communications', icon: MessageCircle, route: '#/communications', bg: 'hover:border-sky-300' },
  ]

  return (
    <div className="bg-surface rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-3xs space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          একাডেমিক অ্যাকশন শর্টকাট (Quick Actions)
        </h3>
        <span className="text-[11px] text-muted">এক ক্লিকে প্রয়োজনীয় মডিউলে প্রবেশ</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {actions.map((act) => {
          const Icon = act.icon
          return (
            <button
              key={act.route}
              type="button"
              onClick={() => onNavigate(act.route)}
              className={`p-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-3xs active:scale-95 ${act.bg}`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-primary-700">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">{act.label}</p>
                <p className="text-[10px] text-muted leading-tight mt-0.5">{act.sub}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
