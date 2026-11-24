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
    { label: 'আজকের ক্লাস', icon: Video, route: '#/classes', bg: 'hover:border-primary-300' },
    { label: 'হাজিরা খাতা', icon: ClipboardCheck, route: '#/attendance', bg: 'hover:border-teal-300' },
    { label: 'ক্লাস রিপোর্ট', icon: FileText, route: '#/reports', bg: 'hover:border-orange-300' },
    { label: 'ছুটির আবেদন', icon: CalendarOff, route: '#/leaves', bg: 'hover:border-amber-300' },
    { label: 'শিক্ষার্থীবৃন্দ', icon: Users, route: '#/students', bg: 'hover:border-emerald-300' },
    { label: 'ভর্তি সেল', icon: UserPlus, route: '#/admissions', bg: 'hover:border-indigo-300' },
    { label: 'ফি ও ইনভয়েস', icon: Receipt, route: '#/invoices', bg: 'hover:border-rose-300' },
    { label: 'যোগাযোগ ও নোটিশ', icon: MessageCircle, route: '#/communications', bg: 'hover:border-sky-300' },
  ]

  return (
    <div className="bg-surface rounded-xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-3.5 shadow-3xs space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
          কুইক অ্যাকশন
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {actions.map((act) => {
          const Icon = act.icon
          return (
            <button
              key={act.route}
              type="button"
              onClick={() => onNavigate(act.route)}
              className={`p-2 min-h-[58px] rounded-lg border border-slate-200/90 dark:border-slate-800 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer shadow-3xs active:scale-95 ${act.bg}`}
            >
              <div className="w-7 h-7 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-700 dark:text-primary-300">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-heading leading-tight">{act.label}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
