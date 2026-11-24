import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useCloudDatabaseSync } from '@/lib/serverSyncAdapter'
import { cn } from '@/lib/utils'

export default function CloudSyncBadge() {
  const { state, pendingCount, syncNow, lastSyncedAt } = useCloudDatabaseSync()

  const config = {
    synced: {
      label: 'ক্লাউড সিঙ্কড',
      icon: Cloud,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100/70',
      dot: 'bg-emerald-500',
    },
    syncing: {
      label: 'সিঙ্ক হচ্ছে...',
      icon: RefreshCw,
      color: 'text-sky-700 bg-sky-50 border-sky-200/80',
      dot: 'bg-sky-500 animate-pulse',
    },
    pending: {
      label: pendingCount > 0 ? `${pendingCount} পরিবর্তন লোকাল` : 'লোকাল মেমোরি',
      icon: CheckCircle2,
      color: 'text-amber-800 bg-amber-50 border-amber-200/80 hover:bg-amber-100/70',
      dot: 'bg-amber-500',
    },
    offline: {
      label: 'অফলাইন মোড',
      icon: CloudOff,
      color: 'text-slate-700 bg-slate-100 border-slate-300',
      dot: 'bg-slate-400',
    },
  }[state]

  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={() => syncNow()}
      title={
        lastSyncedAt
          ? `সর্বশেষ ক্লাউড সিঙ্ক: ${lastSyncedAt.toLocaleTimeString('bn-BD')}. ক্লিক করে ম্যানুয়ালি সিঙ্ক করুন।`
          : 'ক্লিক করে ক্লাউড ডাটাবেসে সিঙ্ক করুন'
      }
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 h-9 rounded-md border text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 select-none whitespace-nowrap',
        config.color,
      )}
    >
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
      <Icon className={cn('w-3.5 h-3.5', state === 'syncing' && 'animate-spin')} />
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  )
}
