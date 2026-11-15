import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useLocalStore } from '@/lib/superAdminStore'
import {
  DAILY_AMOL_RECORDS_KEY,
  DEFAULT_AMOL_RECORDS,
  type DailyAmolRecord,
  type SalahStatus,
  computeAmolDiamonds,
} from '@/lib/amolStore'
import {
  Sparkles, CheckCircle2, ShieldCheck, Clock, Palmtree,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AmolTrackerCardProps {
  studentId: number
  studentName?: string
  isHifz?: boolean
}

const VACATION_PERIODS = [
  { id: 'eid_ul_fitr', label: '🌙 ঈদুল ফিতর অবকাশ' },
  { id: 'eid_ul_adha', label: '🕋 ঈদুল আজহা অবকাশ' },
  { id: 'term_1_break', label: '📖 ১ম সাময়িক পরীক্ষা পরবর্তী ছুটি' },
  { id: 'term_2_break', label: '📝 ২য় সাময়িক পরীক্ষা পরবর্তী ছুটি' },
  { id: 'annual_vacation', label: '🌟 বার্ষিক ছুটি' },
]

export default function AmolTrackerCard({
  studentId,
  studentName = 'আব্দুল্লাহ',
  isHifz = true,
}: AmolTrackerCardProps) {
  const [records, setRecords] = useLocalStore<DailyAmolRecord[]>(
    DAILY_AMOL_RECORDS_KEY,
    DEFAULT_AMOL_RECORDS,
  )
  const toast = useToast()

  const [trackerMode, setTrackerMode] = useState<'daily' | 'vacation'>('daily')
  const [selectedVacation, setSelectedVacation] = useState<string>('eid_ul_fitr')

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const isFridayToday = useMemo(() => new Date().getDay() === 5, [])

  // Find or initialize today's record for this child
  const existingRecord = useMemo(() => {
    return records.find((r) => r.student_id === studentId && r.date === todayStr)
  }, [records, studentId, todayStr])

  const [recordState, setRecordState] = useState<DailyAmolRecord>(() => {
    if (existingRecord) return existingRecord
    return {
      id: `amol-${studentId}-${todayStr}`,
      student_id: studentId,
      student_name: studentName,
      date: todayStr,
      is_friday: isFridayToday,
      fajr: 'jamat',
      dhuhr: 'jamat',
      asr: 'jamat',
      maghrib: 'jamat',
      isha: 'jamat',
      protection_3qul_ayatul_kursi: true,
      sleep_wudu_dua_brush: true,
      parents_respect_help: true,
      is_hifz_student: isHifz,
      non_hifz_30m_quran: true,
      quran_minutes: isHifz ? 60 : 30,
      friday_ghusl_perfume: isFridayToday,
      friday_surah_kahf: isFridayToday,
      friday_durood_100: isFridayToday,
      friday_asr_dua: isFridayToday,
      total_diamonds: 85,
      guardian_confirmed: false,
      updated_at: new Date().toISOString(),
    }
  })

  // Live diamond computation
  const liveDiamonds = useMemo(() => {
    return computeAmolDiamonds(recordState)
  }, [recordState])

  function updateField<K extends keyof DailyAmolRecord>(key: K, value: DailyAmolRecord[K]) {
    setRecordState((prev) => {
      const next = { ...prev, [key]: value }
      next.total_diamonds = computeAmolDiamonds(next)
      return next
    })
  }

  function handleSaveAmol() {
    const updatedRecord: DailyAmolRecord = {
      ...recordState,
      total_diamonds: liveDiamonds,
      guardian_confirmed: true,
      updated_at: new Date().toISOString(),
    }

    const nextRecords = records.filter((r) => !(r.student_id === studentId && r.date === todayStr))
    setRecords([updatedRecord, ...nextRecords])
    toast.success(`মাশাআল্লাহ! আজকের আমল সংরক্ষিত হয়েছে। (+${liveDiamonds} 💎 ডায়মন্ড যুক্ত হয়েছে)`)
  }

  return (
    <Card className="rounded-2xl border-primary-200/80 bg-gradient-to-br from-primary-50/30 via-surface to-teal-50/20 shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🕌</span>
            <h3 className="text-base font-bold text-heading">
              সন্তানের দৈনিক আমল ও সুন্নাহ ট্র্যাকার
            </h3>
            <Badge variant="neutral" className="text-[11px] bg-primary-100/70 text-primary-900 border-primary-300 font-bold">
              {todayStr} {isFridayToday ? '· পবিত্র জুমাবার' : ''}
            </Badge>
          </div>
          <p className="text-xs text-muted mt-1">
            ৫ ওয়াক্ত সালাত, হিফাজতের জিকির ও সুন্নাহ অভ্যাসে সন্তানদের অনুপ্রাণিত করুন
          </p>
        </div>

        {/* Live Diamond Gem Counter */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-300/80 text-amber-900 self-start sm:self-auto shadow-2xs">
          <span className="text-lg animate-pulse">💎</span>
          <div>
            <span className="text-xs text-amber-800 font-medium block leading-none">আজকের অর্জিত পয়েন্ট</span>
            <span className="text-sm font-extrabold text-amber-900 tabular-nums">+{liveDiamonds} ডায়মন্ড</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Regular Daily Amol vs Vacation Special */}
      <div className="px-4 sm:px-5 pt-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-surface/50">
        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/60 shadow-inner">
          <button
            type="button"
            onClick={() => setTrackerMode('daily')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              trackerMode === 'daily'
                ? 'bg-white text-primary-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            📅 নিয়মিত দৈনিক আমল
          </button>
          <button
            type="button"
            onClick={() => setTrackerMode('vacation')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              trackerMode === 'vacation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <Palmtree className="w-3.5 h-3.5" />
            🏖️ ছুটিকালীন বিশেষ আমল
          </button>
        </div>

        {trackerMode === 'vacation' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-900">ছুটির ধরন:</span>
            <select
              value={selectedVacation}
              onChange={(e) => setSelectedVacation(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 py-1 text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {VACATION_PERIODS.map((vp) => (
                <option key={vp.id} value={vp.id}>
                  {vp.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {trackerMode === 'vacation' && (
        <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
          <Palmtree className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">ছুটিকালীন বিশেষ আমল নীতি:</span>
            <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
              ছুটিতে বাচ্চারা যেন অলস সময় না কাটিয়ে রুটিনমাফিক সালাত ও সুন্নাহ চর্চা ধরে রাখে, সেজন্য এই বিশেষ ট্র্যাকার। এর সম্পূর্ণ পয়েন্ট আলাদা <strong>‘ছুটিকালীন বিশেষ আমল লিডারবোর্ডে’</strong> যুক্ত হবে এবং ওয়েবসাইটে স্পেশাল সম্মাননা প্রকাশ করা হবে।
            </span>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-5">
        {/* ── ১. পাঁচ ওয়াক্ত নামাজ ────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold text-heading uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
            <ShieldCheck className="w-4 h-4 text-primary-700" />
            ১. পাঁচ ওয়াক্ত সালাত ট্র্যাকার (জামাত সহ / একা)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'fajr', label: 'ফজর' },
              { id: 'dhuhr', label: 'জোহর' },
              { id: 'asr', label: 'আসর' },
              { id: 'maghrib', label: 'মাগরিব' },
              { id: 'isha', label: 'এশা' },
            ].map(({ id, label }) => {
              const currentVal = recordState[id as keyof DailyAmolRecord] as SalahStatus
              return (
                <div key={id} className="p-2.5 rounded-xl border border-border bg-surface text-center space-y-1.5 shadow-3xs">
                  <span className="text-xs font-bold text-heading block">{label}</span>
                  <div className="grid grid-cols-3 gap-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => updateField(id as any, 'jamat')}
                      className={cn(
                        'py-1 rounded-md transition-colors cursor-pointer',
                        currentVal === 'jamat'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-bg text-muted hover:text-heading',
                      )}
                      title="জামাতে আদায় (১৫ 💎)"
                    >
                      জামাত
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField(id as any, 'alone')}
                      className={cn(
                        'py-1 rounded-md transition-colors cursor-pointer',
                        currentVal === 'alone'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-bg text-muted hover:text-heading',
                      )}
                      title="একাকী আদায় (১০ 💎)"
                    >
                      একা
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField(id as any, 'missed')}
                      className={cn(
                        'py-1 rounded-md transition-colors cursor-pointer',
                        currentVal === 'missed'
                          ? 'bg-slate-300 text-slate-700'
                          : 'bg-bg text-muted hover:text-heading',
                      )}
                      title="আদায় হয়নি (০ 💎)"
                    >
                      —
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── ২. দৈনিক হিফাজতের আমল ও সুন্নাহ অভ্যাস ────────── */}
        <div>
          <h4 className="text-xs font-bold text-heading uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            ২. দৈনিক হিফাজত ও বরকতময় সুন্নাহ
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label className={cn(
              'flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none',
              recordState.protection_3qul_ayatul_kursi
                ? 'bg-primary-50/70 border-primary-300 shadow-2xs'
                : 'bg-surface border-border hover:bg-bg',
            )}>
              <input
                type="checkbox"
                checked={recordState.protection_3qul_ayatul_kursi}
                onChange={(e) => updateField('protection_3qul_ayatul_kursi', e.target.checked)}
                className="mt-0.5 rounded text-primary-700 focus:ring-primary-500 w-4 h-4 accent-primary-700 cursor-pointer"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-heading block">সকাল-সন্ধ্যার হিফাজত</span>
                <span className="text-[11px] text-muted leading-tight block mt-0.5">
                  আয়াতুল কুরসি ও ৩ কুল (ইখলাস, ফালাক, নাস) পাঠ (+১০ 💎)
                </span>
              </div>
            </label>

            <label className={cn(
              'flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none',
              recordState.sleep_wudu_dua_brush
                ? 'bg-primary-50/70 border-primary-300 shadow-2xs'
                : 'bg-surface border-border hover:bg-bg',
            )}>
              <input
                type="checkbox"
                checked={recordState.sleep_wudu_dua_brush}
                onChange={(e) => updateField('sleep_wudu_dua_brush', e.target.checked)}
                className="mt-0.5 rounded text-primary-700 focus:ring-primary-500 w-4 h-4 accent-primary-700 cursor-pointer"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-heading block">ঘুমানোর সুন্নাহ ও পরিচ্ছন্নতা</span>
                <span className="text-[11px] text-muted leading-tight block mt-0.5">
                  মেসওয়াক/ব্রাশ, ওযু করে ঘুমানো ও ঘুমানোর দোয়া (+১০ 💎)
                </span>
              </div>
            </label>

            <label className={cn(
              'flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none',
              recordState.parents_respect_help
                ? 'bg-primary-50/70 border-primary-300 shadow-2xs'
                : 'bg-surface border-border hover:bg-bg',
            )}>
              <input
                type="checkbox"
                checked={recordState.parents_respect_help}
                onChange={(e) => updateField('parents_respect_help', e.target.checked)}
                className="mt-0.5 rounded text-primary-700 focus:ring-primary-500 w-4 h-4 accent-primary-700 cursor-pointer"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-heading block">মা-বাবার সাথে সদ্ব্যবহার</span>
                <span className="text-[11px] text-muted leading-tight block mt-0.5">
                  সালাম দেওয়া ও বিনয়ের সাথে সাহায্য করা (+৫ 💎)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* ── ৩. নাজেরা কোর্সের জন্য ৩০ মিনিট কুরআন ট্র্যাকার ─── */}
        {!isHifz && (
          <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-700" />
                নাজেরা শিক্ষার্থীদের প্রতিদিনের ৩০ মিনিট কুরআন পড়ার ট্র্যাকার
              </span>
              <span className="text-xs font-bold text-teal-800">
                {recordState.quran_minutes ?? 30} মিনিট
              </span>
            </div>
            <p className="text-[11px] text-teal-800">
              * হিফজ ছাড়া অন্য শিক্ষার্থীদের প্রতিদিন ন্যূনতম ৩০ মিনিট তিলাওয়াত আবশ্যক। ৩০ মিনিটের কম হলে পয়েন্ট কাটা যাবে।
            </p>
            <input
              type="range"
              min="0"
              max="60"
              step="15"
              value={recordState.quran_minutes ?? 30}
              onChange={(e) => updateField('quran_minutes', Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span className="text-red-600 font-semibold">০ মিনিট (-৫ 💎)</span>
              <span className="text-amber-700 font-semibold">১৫ মিনিট</span>
              <span className="text-emerald-700 font-bold">৩০ মিনিট লক্ষ্য (+১৫ 💎)</span>
              <span className="text-teal-700 font-bold">৪৫+ মিনিট সুপার বোনাস</span>
            </div>
          </div>
        )}

        {/* ── ৪. শুক্রবারের বিশেষ মিশন (Friday Sunnah Quests) ─── */}
        <div className="p-3.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
              <span>🕌</span>
              পবিত্র শুক্রবারের বিশেষ সুন্নাহ মিশন (Friday Quests)
            </h4>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              জুমার বিশেষ ডায়মন্ড
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recordState.friday_ghusl_perfume ?? false}
                onChange={(e) => updateField('friday_ghusl_perfume', e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded accent-amber-600 cursor-pointer"
              />
              <span>জুমার গোসল, সুগন্ধি ও পরিষ্কার জামা (+১০ 💎)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recordState.friday_surah_kahf ?? false}
                onChange={(e) => updateField('friday_surah_kahf', e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded accent-amber-600 cursor-pointer"
              />
              <span>সূরা কাহাফ তিলাওয়াত / শ্রবণ (+২০ 💎)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recordState.friday_durood_100 ?? false}
                onChange={(e) => updateField('friday_durood_100', e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded accent-amber-600 cursor-pointer"
              />
              <span>দরুদ শরীফ পাঠ (অন্তত ১০০ বার) (+১৫ 💎)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recordState.friday_asr_dua ?? false}
                onChange={(e) => updateField('friday_asr_dua', e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded accent-amber-600 cursor-pointer"
              />
              <span>আসরের পর বিশেষ দোয়া ও মোনাজাত (+১০ 💎)</span>
            </label>
          </div>
        </div>

        {/* Guardian Note & Confirmation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <input
            type="text"
            placeholder="অভিভাবকের কোনো মন্তব্য বা দোয়া থাকলে লিখুন..."
            value={recordState.guardian_notes ?? ''}
            onChange={(e) => updateField('guardian_notes', e.target.value)}
            className="flex-1 text-xs rounded-xl border border-border bg-surface px-3 py-2 text-heading placeholder:text-muted focus:outline-none focus:border-primary-400"
          />

          <Button
            type="button"
            onClick={handleSaveAmol}
            className="bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-semibold px-4 py-2 cursor-pointer flex-shrink-0 gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" /> আজকের আমল নিশ্চিত ও পয়েন্ট যোগ করুন
          </Button>
        </div>
      </div>
    </Card>
  )
}
