import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Trophy, Sparkles, Award, Crown, ChevronUp, ChevronDown, Minus,
  Palmtree, ShieldCheck, HeartHandshake, Info, Star, CheckCircle,
} from 'lucide-react'

export interface LeaderboardStudent {
  id: string
  rank: number
  previous_rank?: number
  name: string
  avatar_initials: string
  batch_name: string
  course_title: string
  level: number
  total_diamonds: number // total score points
  attendance_score: number // 30%
  homework_score: number // 35%
  performance_score: number // 35%
  is_current_user?: boolean
  shoutout?: string
  vacation_verified?: boolean
  vacation_type?: string
}

// 1. 3-Month Grand Champion Leaderboard (সব ব্যাচের সেরাদের সেরা - ত্রৈমাসিক)
const QUARTERLY_GRAND_CHAMPIONS: LeaderboardStudent[] = [
  {
    id: 'g-1',
    rank: 1,
    previous_rank: 1,
    name: 'মারিয়াম বিনতে রফিক',
    avatar_initials: 'মবি',
    batch_name: 'তাজবীদ ব্যাচ ১',
    course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
    level: 28,
    total_diamonds: 9850,
    attendance_score: 99,
    homework_score: 98,
    performance_score: 98,
    is_current_user: true,
    shoutout: 'মাশাআল্লাহ! বিগত ৩ মাসের টানা ১০০% হাজিরা এবং প্রতিদিনের সহীহ তাজবীদ ও সবক পাঠে সেরা!',
  },
  {
    id: 'g-2',
    rank: 2,
    previous_rank: 3,
    name: 'মুহাম্মাদ আনাস ইসলাম',
    avatar_initials: 'আই',
    batch_name: 'হিফজুল কুরআন ১:১',
    course_title: 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম',
    level: 25,
    total_diamonds: 9420,
    attendance_score: 96,
    homework_score: 94,
    performance_score: 93,
    is_current_user: false,
    shoutout: 'নিয়মিত নতুন সবক এবং আমোক্তা তিলাওয়াতে টানা ৩ মাস শীর্ষ তালিকায় অবস্থান করছে।',
  },
  {
    id: 'g-3',
    rank: 3,
    previous_rank: 2,
    name: 'আব্দুল্লাহ আল মাহমুদ',
    avatar_initials: 'আম',
    batch_name: 'নাজেরা সান্ধ্যকালীন ব্যাচ',
    course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
    level: 24,
    total_diamonds: 9150,
    attendance_score: 94,
    homework_score: 92,
    performance_score: 89,
    is_current_user: false,
    shoutout: 'সময়মতো সকল মাশক ও হোমওয়ার্ক রেকর্ডিং জমা দিয়ে মেধা তালিকায় ৩য় স্থান অর্জন করেছে।',
  },
  {
    id: 'g-4',
    rank: 4,
    previous_rank: 5,
    name: 'ফাতিমা তুয যাহরা',
    avatar_initials: 'ফয',
    batch_name: 'হিফজুল কুরআন ১:১',
    course_title: 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম',
    level: 23,
    total_diamonds: 8900,
    attendance_score: 93,
    homework_score: 90,
    performance_score: 87,
  },
  {
    id: 'g-5',
    rank: 5,
    previous_rank: 4,
    name: 'জুবায়ের আহমেদ',
    avatar_initials: 'জা',
    batch_name: 'তাজবীদ ব্যাচ ১',
    course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
    level: 22,
    total_diamonds: 8640,
    attendance_score: 91,
    homework_score: 88,
    performance_score: 86,
  },
  {
    id: 'g-6',
    rank: 6,
    previous_rank: 6,
    name: 'নুসরাত জাহান',
    avatar_initials: 'নজ',
    batch_name: 'নাজেরা সান্ধ্যকালীন ব্যাচ',
    course_title: 'নাজেরা ও বুনিয়াদী কুরআন শিক্ষা',
    level: 21,
    total_diamonds: 8320,
    attendance_score: 89,
    homework_score: 85,
    performance_score: 84,
  },
  {
    id: 'g-7',
    rank: 7,
    previous_rank: 8,
    name: 'মুহতাসিম বিল্লাহ',
    avatar_initials: 'মবি',
    batch_name: 'তাজবীদ ব্যাচ ১',
    course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
    level: 20,
    total_diamonds: 8100,
    attendance_score: 88,
    homework_score: 83,
    performance_score: 82,
  },
]

// 2. Monthly Batch-wise Leaderboard (মাসিক প্রতিটি ব্যাচের লিডারবোর্ড)
const MONTHLY_BATCH_STUDENTS: Record<string, LeaderboardStudent[]> = {
  all: [
    {
      id: 'm-1',
      rank: 1,
      previous_rank: 1,
      name: 'মারিয়াম বিনতে রফিক',
      avatar_initials: 'মবি',
      batch_name: 'তাজবীদ ব্যাচ ১',
      course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
      level: 12,
      total_diamonds: 980,
      attendance_score: 100,
      homework_score: 98,
      performance_score: 97,
      is_current_user: true,
      shoutout: 'এই মাসে শতভাগ উপস্থিতি ও চমৎকার তাজবীদ মাশকে ব্যাচের সেরা শিক্ষার্থী!',
    },
    {
      id: 'm-2',
      rank: 2,
      previous_rank: 4,
      name: 'মুহাম্মাদ আনাস ইসলাম',
      avatar_initials: 'আই',
      batch_name: 'হিফজুল কুরআন ১:১',
      course_title: 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম',
      level: 11,
      total_diamonds: 940,
      attendance_score: 96,
      homework_score: 95,
      performance_score: 92,
      is_current_user: false,
    },
    {
      id: 'm-3',
      rank: 3,
      previous_rank: 2,
      name: 'আব্দুল্লাহ আল মাহমুদ',
      avatar_initials: 'আম',
      batch_name: 'নাজেরা সান্ধ্যকালীন ব্যাচ',
      course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
      level: 10,
      total_diamonds: 900,
      attendance_score: 92,
      homework_score: 90,
      performance_score: 88,
      is_current_user: false,
    },
    {
      id: 'm-4',
      rank: 4,
      previous_rank: 3,
      name: 'ফাতিমা তুয যাহরা',
      avatar_initials: 'ফয',
      batch_name: 'হিফজুল কুরআন ১:১',
      course_title: 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম',
      level: 9,
      total_diamonds: 870,
      attendance_score: 90,
      homework_score: 88,
      performance_score: 85,
    },
    {
      id: 'm-5',
      rank: 5,
      previous_rank: 5,
      name: 'জুবায়ের আহমেদ',
      avatar_initials: 'জা',
      batch_name: 'তাজবীদ ব্যাচ ১',
      course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
      level: 9,
      total_diamonds: 840,
      attendance_score: 88,
      homework_score: 85,
      performance_score: 82,
    },
    {
      id: 'm-6',
      rank: 6,
      previous_rank: 6,
      name: 'মুহতাসিম বিল্লাহ',
      avatar_initials: 'মবি',
      batch_name: 'তাজবীদ ব্যাচ ১',
      course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
      level: 8,
      total_diamonds: 810,
      attendance_score: 86,
      homework_score: 82,
      performance_score: 80,
    },
  ],
  'tajweed-1': [
    {
      id: 'tj-1',
      rank: 1,
      previous_rank: 1,
      name: 'মারিয়াম বিনতে রফিক',
      avatar_initials: 'মবি',
      batch_name: 'তাজবীদ ব্যাচ ১',
      course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
      level: 12,
      total_diamonds: 980,
      attendance_score: 100,
      homework_score: 98,
      performance_score: 97,
      is_current_user: true,
      shoutout: 'তাজবীদ ও মাখরাজ উচ্চারণে অনন্য নৈপুণ্য প্রদর্শন করেছে।',
    },
    {
      id: 'tj-2',
      rank: 2,
      previous_rank: 3,
      name: 'জুবায়ের আহমেদ',
      avatar_initials: 'জা',
      batch_name: 'তাজবীদ ব্যাচ ১',
      course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
      level: 9,
      total_diamonds: 840,
      attendance_score: 88,
      homework_score: 85,
      performance_score: 82,
    },
    {
      id: 'tj-3',
      rank: 3,
      previous_rank: 2,
      name: 'মুহতাসিম বিল্লাহ',
      avatar_initials: 'মবি',
      batch_name: 'তাজবীদ ব্যাচ ১',
      course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
      level: 8,
      total_diamonds: 810,
      attendance_score: 86,
      homework_score: 82,
      performance_score: 80,
    },
  ],
  'hifz-1': [
    {
      id: 'hf-1',
      rank: 1,
      previous_rank: 1,
      name: 'মুহাম্মাদ আনাস ইসলাম',
      avatar_initials: 'আই',
      batch_name: 'হিফজুল কুরআন ১:১',
      course_title: 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম',
      level: 11,
      total_diamonds: 940,
      attendance_score: 96,
      homework_score: 95,
      performance_score: 92,
      shoutout: 'হিফজুল কুরআনে ১:১ পাঠে দৈনিক ২ পৃষ্ঠা সবক শুনিয়েছে।',
    },
    {
      id: 'hf-2',
      rank: 2,
      previous_rank: 2,
      name: 'ফাতিমা তুয যাহরা',
      avatar_initials: 'ফয',
      batch_name: 'হিফজুল কুরআন ১:১',
      course_title: 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম',
      level: 9,
      total_diamonds: 870,
      attendance_score: 90,
      homework_score: 88,
      performance_score: 85,
    },
  ],
}

// 3. Vacation Special Champions (ছুটিকালীন বিশেষ আমল লিডারবোর্ড - Verified strictly by Guardian Portal)
const VACATION_SPECIAL_CHAMPIONS: LeaderboardStudent[] = [
  {
    id: 'vac-1',
    rank: 1,
    previous_rank: 2,
    name: 'আব্দুল্লাহ আল মাহমুদ',
    avatar_initials: 'আম',
    batch_name: 'নাজেরা সান্ধ্যকালীন ব্যাচ',
    course_title: 'ঈদুল ফিতর বিশেষ আমল মিশন',
    level: 14,
    total_diamonds: 1850,
    attendance_score: 100,
    homework_score: 100,
    performance_score: 98,
    is_current_user: false,
    vacation_verified: true,
    vacation_type: 'ঈদুল ফিতর অবকাশ',
    shoutout: 'ছুটিতেও প্রতিদিন ৫ ওয়াক্ত সালাত জামাতে ও সকাল-সন্ধ্যার হিফাজতের আমল পূর্ণাঙ্গ পালন করেছে!',
  },
  {
    id: 'vac-2',
    rank: 2,
    previous_rank: 1,
    name: 'মারিয়াম বিনতে রফিক',
    avatar_initials: 'মবি',
    batch_name: 'তাজবীদ ব্যাচ ১',
    course_title: 'ঈদুল ফিতর বিশেষ আমল মিশন',
    level: 14,
    total_diamonds: 1820,
    attendance_score: 100,
    homework_score: 98,
    performance_score: 96,
    is_current_user: true,
    vacation_verified: true,
    vacation_type: 'ঈদুল ফিতর অবকাশ',
    shoutout: 'ছুটিতে নিয়মিত ১ পারা করে তিলাওয়াত ও মা-বাবার খেদমতে সেরা স্বাক্ষর রেখেছে।',
  },
  {
    id: 'vac-3',
    rank: 3,
    previous_rank: 3,
    name: 'মুহাম্মাদ আনাস ইসলাম',
    avatar_initials: 'আই',
    batch_name: 'হিফজুল কুরআন ১:১',
    course_title: 'ঈদুল ফিতর বিশেষ আমল মিশন',
    level: 13,
    total_diamonds: 1760,
    attendance_score: 96,
    homework_score: 95,
    performance_score: 95,
    vacation_verified: true,
    vacation_type: 'ঈদুল ফিতর অবকাশ',
    shoutout: 'ছুটিকালীন হিফজ রিভিশন ও জুমার আমল শতভাগ সম্পন্ন করেছে।',
  },
  {
    id: 'vac-4',
    rank: 4,
    previous_rank: 5,
    name: 'ফাতিমা তুয যাহরা',
    avatar_initials: 'ফয',
    batch_name: 'হিফজুল কুরআন ১:১',
    course_title: 'ঈদুল ফিতর বিশেষ আমল মিশন',
    level: 12,
    total_diamonds: 1680,
    attendance_score: 95,
    homework_score: 92,
    performance_score: 90,
    vacation_verified: true,
    vacation_type: 'ঈদুল ফিতর অবকাশ',
  },
  {
    id: 'vac-5',
    rank: 5,
    previous_rank: 4,
    name: 'জুবায়ের আহমেদ',
    avatar_initials: 'জা',
    batch_name: 'তাজবীদ ব্যাচ ১',
    course_title: 'ঈদুল ফিতর বিশেষ আমল মিশন',
    level: 11,
    total_diamonds: 1590,
    attendance_score: 92,
    homework_score: 88,
    performance_score: 86,
    vacation_verified: true,
    vacation_type: 'ঈদুল ফিতর অবকাশ',
  },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'quarterly' | 'vacation'>('monthly')
  const [selectedBatch, setSelectedBatch] = useState<string>('all')

  const studentList = useMemo(() => {
    if (activeTab === 'quarterly') {
      return QUARTERLY_GRAND_CHAMPIONS
    }
    if (activeTab === 'vacation') {
      return VACATION_SPECIAL_CHAMPIONS
    }
    return MONTHLY_BATCH_STUDENTS[selectedBatch] || MONTHLY_BATCH_STUDENTS.all
  }, [activeTab, selectedBatch])

  const top1 = studentList[0]
  const top2 = studentList[1]
  const top3 = studentList[2]
  const runnersUp = studentList.slice(3)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      {/* ── Top Hero Card (Inspired by Vertical Mobile Gamified UI) ── */}
      <div className="relative rounded-3xl bg-gradient-to-b from-sky-400/20 via-sky-50/50 to-surface border border-sky-200/80 p-5 sm:p-7 shadow-sm overflow-hidden text-center">
        {/* Decorative Floating Spheres */}
        <div className="absolute left-4 top-4 w-14 h-14 rounded-full bg-amber-400/20 blur-md pointer-events-none" />
        <div className="absolute right-6 top-6 w-20 h-20 rounded-full bg-indigo-400/15 blur-lg pointer-events-none" />

        {/* Floating Gamified "Together is better" Motivational Card */}
        <div className="absolute right-3 sm:right-6 top-3 sm:top-5 hidden md:flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/95 border border-sky-200 shadow-md max-w-xs text-left backdrop-blur-sm z-10 transition-transform hover:scale-102">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-sky-400 flex items-center justify-center text-xl shadow-xs shrink-0">
            🌱
          </div>
          <div className="min-w-0 pr-1">
            <p className="text-xs font-bold text-sky-950 flex items-center gap-1 leading-tight">
              Together is better! <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            </p>
            <p className="text-[10px] text-muted leading-tight mt-0.5">
              আপনি সহপাঠীদের <strong className="text-emerald-700 font-extrabold">৮১%</strong> এর চেয়ে বেশি পয়েন্টে এগিয়ে আছেন!
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-muted">
          <span className="flex items-center gap-1.5 text-primary-700">
            <Trophy className="w-4 h-4 text-amber-500" /> IOM Itqaan Star Leaderboards
          </span>
          <Badge variant="neutral" className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
            <Sparkles className="w-3 h-3 text-amber-600 mr-1" /> Season 2026
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-heading tracking-tight flex items-center justify-center gap-2">
          🏆 Honor Roll &amp; Leaderboards
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto mt-1">
          উপস্থিতি, সবক তিলাওয়াত, হোমওয়ার্ক ও নিয়মিত আমল মূল্যায়নে সম্মানিত মেধাবী শিক্ষার্থীদের তালিকা।
        </p>

        {/* ── Segmented Control (3 Primary Modes) ── */}
        <div className="mt-5 inline-flex p-1.5 rounded-2xl bg-slate-200/70 border border-slate-300/60 shadow-inner flex-wrap justify-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-white text-primary-900 shadow-sm ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 মাসিক ব্যাচ সেরা
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quarterly')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quarterly'
                ? 'bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-500/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-800" />
            👑 ৩ মাসের সেরাদের সেরা
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vacation')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vacation'
                ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palmtree className="w-4 h-4 text-emerald-200" />
            🏖️ ছুটির আমল চ্যাম্পিয়ন
          </button>
        </div>

        {/* Batch filter if in monthly tab */}
        {activeTab === 'monthly' && (
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted">ব্যাচ নির্বাচন:</span>
            {[
              { id: 'all', label: 'সকল ব্যাচ সম্মিলিত' },
              { id: 'tajweed-1', label: 'তাজবীদ ব্যাচ ১' },
              { id: 'hifz-1', label: 'হিফজুল কুরআন ১:১' },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBatch(b.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedBatch === b.id
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-white/90 border border-border text-body hover:bg-primary-50'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}

        {/* Vacation Explanation Notice when vacation tab is active */}
        {activeTab === 'vacation' && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <p className="font-bold text-heading">অভিভাবক ভেরিফাইড ছুটির আমল লিডারবোর্ড:</p>
                <p className="text-[11px] text-emerald-800">
                  ছুটিতে সাধারণ একাডেমিক ক্লাস বন্ধ থাকায় নিয়মিত স্কোর অপরিবর্তিত থাকে। শুধুমাত্র অভিভাবক পোর্টাল থেকে ভেরিফাইড সালাত, জিকির ও সুন্নাহ আমল এখানে গণনা করা হয়েছে।
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shrink-0">
              🌟 Frontend Shoutout
            </span>
          </div>
        )}

        {/* Score Counting Insight Pill for regular tabs */}
        {activeTab !== 'vacation' && (
          <div className="mt-4 p-3 rounded-2xl bg-white/80 border border-sky-200 text-xs text-sky-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
                💎
              </div>
              <div>
                <p className="font-bold text-heading">পয়েন্ট ও স্কোর যেভাবে স্বয়ংক্রিয়ভাবে হিসাব হয়:</p>
                <p className="text-[11px] text-muted">
                  হাজিরা (৩০%) + ডেইলি পড়া/সবক (৩৫%) + হোমওয়ার্ক ও তাজবীদ মাশক (৩৫%) = ১০০০ 💎 স্ট্যান্ডার্ড মান
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
              ✅ ১০০% নিরপেক্ষ অটোমেটিক পয়েন্ট
            </span>
          </div>
        )}
      </div>

      {/* ── Top 3 Podium (Matching vertical game / mobile style from user image) ── */}
      <div className="pt-8 pb-4 px-2">
        <div className="flex items-end justify-center gap-2 sm:gap-6 max-w-xl mx-auto">
          {/* 2nd Place (Left - Rose Block) */}
          {top2 && (
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center font-black text-lg sm:text-xl shadow-md">
                  {top2.avatar_initials}
                </div>
                <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black border border-white">
                  Lvl {top2.level}
                </span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-heading text-center truncate w-full px-1">
                {top2.name}
              </p>
              <span className="text-xs font-bold text-primary-700 flex items-center gap-1 mt-0.5">
                💎 {top2.total_diamonds.toLocaleString()}
              </span>
              {/* Podium Block 2nd */}
              <div className="w-full mt-3 h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-rose-400 to-rose-500 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-sm">
                2nd
              </div>
            </div>
          )}

          {/* 1st Place (Center - Highest with Crown - Gold Block) */}
          {top1 && (
            <div className="flex-1 flex flex-col items-center -mt-6">
              <div className="relative mb-2">
                <Crown className="w-8 h-8 text-amber-500 absolute -top-7 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce" />
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-950 flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg ring-4 ring-amber-300/40">
                  {top1.avatar_initials}
                </div>
                <span className="absolute -top-2 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black border-2 border-white">
                  Lvl {top1.level}
                </span>
              </div>
              <p className="font-black text-sm sm:text-base text-heading text-center truncate w-full px-1">
                {top1.name}
              </p>
              <span className="text-xs sm:text-sm font-extrabold text-amber-800 flex items-center gap-1 mt-0.5">
                💎 {top1.total_diamonds.toLocaleString()}
              </span>
              {/* Podium Block 1st */}
              <div className="w-full mt-3 h-32 sm:h-36 rounded-t-2xl bg-gradient-to-b from-amber-400 via-amber-400 to-amber-500 text-amber-950 font-black text-xl sm:text-2xl flex items-center justify-center shadow-md">
                1st 👑
              </div>
            </div>
          )}

          {/* 3rd Place (Right - Blue Block) */}
          {top3 && (
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-700/40 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 flex items-center justify-center font-black text-lg sm:text-xl shadow-md">
                  {top3.avatar_initials}
                </div>
                <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black border border-white">
                  Lvl {top3.level}
                </span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-heading text-center truncate w-full px-1">
                {top3.name}
              </p>
              <span className="text-xs font-bold text-primary-700 flex items-center gap-1 mt-0.5">
                💎 {top3.total_diamonds.toLocaleString()}
              </span>
              {/* Podium Block 3rd */}
              <div className="w-full mt-3 h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-sky-500 to-sky-600 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-sm">
                3rd
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Vertical Ranked List (Matching positions 4 to N from reference image) ── */}
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 px-4 py-2.5 border-b border-border text-[11px] font-bold text-muted uppercase flex items-center justify-between">
          <span>র‍্যাঙ্ক ও শিক্ষার্থী</span>
          <span className="pr-2">মোট অর্জিত পয়েন্ট (Diamonds)</span>
        </div>
        <div className="divide-y divide-border/60">
          {runnersUp.map((student) => {
            const rankDiff = (student.previous_rank ?? student.rank) - student.rank
            const isUserHighlighted = student.is_current_user || student.rank === 4 // Highlight like row 7 in sample
            return (
              <div
                key={student.id}
                className={`p-3.5 sm:px-5 flex items-center justify-between gap-3 transition-colors ${
                  isUserHighlighted
                    ? 'bg-sky-50/90 border-l-4 border-l-sky-500 shadow-2xs'
                    : 'hover:bg-bg/60'
                }`}
              >
                {/* Rank & Movement Arrow */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 w-10 text-center shrink-0">
                    <span className="font-extrabold text-sm sm:text-base text-muted tabular-nums">
                      {student.rank}
                    </span>
                    {rankDiff > 0 ? (
                      <span className="text-emerald-600 flex items-center text-xs" title="Upward movement">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </span>
                    ) : rankDiff < 0 ? (
                      <span className="text-rose-600 flex items-center text-xs" title="Downward movement">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-300 flex items-center text-xs">
                        <Minus className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-100 text-primary-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {student.avatar_initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-heading truncate flex items-center gap-2">
                      {student.name}
                      {student.is_current_user && (
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-200/80 px-1.5 py-0.5 rounded">
                          আপনার সন্তান
                        </span>
                      )}
                      {student.vacation_verified && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> ভেরিফাইড
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {student.batch_name} · <span className="font-semibold text-primary-700">Lvl {student.level}</span>
                    </p>
                  </div>
                </div>

                {/* Score & Points */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-extrabold text-sm sm:text-base text-heading tabular-nums flex items-center gap-1 text-primary-900">
                    <span className="text-amber-500 text-xs">💎</span>
                    {student.total_diamonds.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Fairness Engine Assurance Card (ব্যাচ সমবণ্টন ইঞ্জিন নিশ্চয়তা) ── */}
      <Card className="rounded-2xl border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-surface to-sky-50/30 p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Info className="w-4 h-4 text-indigo-700" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-heading">
              পয়েন্ট ইঞ্জিন গ্যারান্টি ও ব্যাচ সমবণ্টন নীতি (Fairness Guarantee)
            </h3>
            <p className="text-xs text-muted">
              সকল ব্যাচ ও শিক্ষার্থীদের জন্য ১০০% সমতা ও নিরপেক্ষ পয়েন্ট নীতি
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-surface border border-indigo-100 space-y-1">
            <p className="font-bold text-indigo-900 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> ১০০০ 💎 স্ট্যান্ডার্ড মান
            </p>
            <p className="text-muted leading-relaxed text-[11px]">
              হাজিরা (৩০%), সবক (৩৫%) এবং হোমওয়ার্ক (৩৫%) — প্রতি মাসে মোট ১০০০ পয়েন্টের আনুপাতিক স্কেলে নরমালাইজড করা হয়।
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-indigo-100 space-y-1">
            <p className="font-bold text-indigo-900 flex items-center gap-1">
              ⚖️ ব্যাচভিত্তিক তারতম্যহীনতা
            </p>
            <p className="text-muted leading-relaxed text-[11px]">
              সপ্তাহে ৩ দিন বা ৫ দিনের ব্যাচে পয়েন্টের কোনো কম-বেশি হবে না; ক্লাসের সংখ্যার অনুপাতে স্বয়ংক্রিয়ভাবে পয়েন্ট সমন্বিত হয়।
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-indigo-100 space-y-1">
            <p className="font-bold text-indigo-900 flex items-center gap-1">
              🏖️ ছুটির পয়েন্টের স্বাতন্ত্র্য
            </p>
            <p className="text-muted leading-relaxed text-[11px]">
              ছুটির আমলের পয়েন্ট শুধুমাত্র ‘ছুটির আমল লিডারবোর্ডে’ যোগ হয়, যাতে কোনো শিক্ষার্থী ছুটিতে বাড়ি গিয়ে নিয়মিত লিডারবোর্ডে পিছিয়ে না পড়ে।
            </p>
          </div>
        </div>
      </Card>

      {/* ── Shoutout & Teacher Honors Section ── */}
      <Card className="rounded-2xl border-amber-300/70 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 shadow-xs p-5 space-y-3">
        <h3 className="font-bold text-sm text-heading flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          শিক্ষক ও কর্তৃপক্ষের বিশেষ প্রশংসা বার্তা (Honor Shoutouts)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {studentList.filter((s) => s.shoutout).map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-surface border border-amber-200/60 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary-800">{s.name} ({s.batch_name})</span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  র‍্যাঙ্ক #{s.rank}
                </span>
              </div>
              <p className="text-body italic">&ldquo;{s.shoutout}&rdquo;</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
