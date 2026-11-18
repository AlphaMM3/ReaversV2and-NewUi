import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { navigateTo } from '@/lib/router'
import { getDhakaDateString } from '@/lib/utils'
import { useAcademicMetrics, useFinancialMetrics } from '../dashboard/hooks/useDashboardMetrics'
import { useQuery } from '@tanstack/react-query'
import { api, toArray, type ClassSession, type CurrentUser } from '@/lib/api'
import type { InvoiceMini, PayableMini, MonthlyAttendanceRow } from '../dashboard/types'
import { useLocalStore, EXPENSES_KEY, TEACHER_LEAVES_KEY, STAR_STUDENTS_KEY, DEFAULT_STAR_STUDENTS } from '@/lib/superAdminStore'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  action?: {
    label: string
    route: string
  }
  timestamp: string
}

interface Props {
  user: CurrentUser
  isOpen: boolean
  onClose: () => void
}

export default function AcademyAssistantDrawer({ user, isOpen, onClose }: Props) {
  const today = getDhakaDateString()
  const monthKey = today.slice(0, 7)
  const [input, setInput] = useState('')

  // Query Academy Data
  const { data: monthClasses = [] } = useQuery<ClassSession[]>({
    queryKey: ['dashboard-month-classes', monthKey],
    queryFn: () => api.get<ClassSession[] | { items?: ClassSession[] }>(`/classes?month=${monthKey}&limit=500`).then(toArray).catch(() => []),
  })
  const { data: invoices = [] } = useQuery<InvoiceMini[]>({
    queryKey: ['dashboard-invoices'],
    queryFn: () => api.get<InvoiceMini[] | { items?: InvoiceMini[] }>('/invoices?limit=500').then(toArray).catch(() => []),
  })
  const { data: payables = [] } = useQuery<PayableMini[]>({
    queryKey: ['dashboard-payables'],
    queryFn: () => api.get<PayableMini[] | { items?: PayableMini[] }>('/payables?limit=200').then(toArray).catch(() => []),
  })
  const { data: monthlyAttendance = [] } = useQuery<MonthlyAttendanceRow[]>({
    queryKey: ['dashboard-monthly-attendance', monthKey],
    queryFn: () => api.get<MonthlyAttendanceRow[] | { items?: MonthlyAttendanceRow[] }>(`/attendance/monthly?month=${monthKey}`).then(toArray).catch(() => []),
  })

  const [expenses] = useLocalStore(EXPENSES_KEY, [])
  const [teacherLeaves] = useLocalStore(TEACHER_LEAVES_KEY, [])
  const [starStudents] = useLocalStore(STAR_STUDENTS_KEY, DEFAULT_STAR_STUDENTS)

  const academic = useAcademicMetrics({
    monthClasses,
    leaves: [],
    admissions: [],
    openFollowups: [],
    teacherLeaves,
    monthlyAttendance,
    today,
  })

  const finance = useFinancialMetrics({
    invoices,
    payables,
    expenses,
    monthKey,
  })

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `আসসালামু আলাইকুম ${user.name}! আমি 'ইতকান অ্যাকাডেমি এআই সহকারী'। অ্যাকাডেমির লাইভ ক্লাস, উপস্থিতি, ফি আদায় কিংবা যেকোনো হিসাব সম্পর্কে আমাকে প্রশ্ন করতে পারেন।`,
      timestamp: 'এখন',
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const quickQuestions = [
    'আজকের ক্লাসের সার্বিক অবস্থা কেমন?',
    'বকেয়া টিউশন ফি কত টাকা?',
    'অনুপস্থিত শিক্ষার্থী ও ফলো-আপ কেস আছে?',
    'চলতি মাসের সেরা ছাত্র (স্টার স্টুডেন্ট) কারা?',
    'শিক্ষকদের বকেয়া বেতন কত?',
  ]

  const handleAsk = (query: string) => {
    if (!query.trim()) return
    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')

    // Generate Context-Aware Islamic Academy Response
    setTimeout(() => {
      let replyText = ''
      let action: { label: string; route: string } | undefined

      const q = query.toLowerCase()

      if (q.includes('আজকের') || q.includes('ক্লাস') || q.includes('class')) {
        const live = academic.todayClasses.filter((c) => c.status === 'in_progress').length
        const ended = academic.todayClasses.filter((c) => c.status === 'ended').length
        const total = academic.todayClasses.length
        replyText = `আজকে মোট ${total}টি অনলাইন ক্লাস নির্ধারিত রয়েছে। এর মধ্যে বর্তমানে ${live}টি লাইভ চলমান, ${ended}টি সম্পন্ন হয়েছে এবং বাকিগুলো শিডিউল অনুযায়ী শুরু হবে।`
        action = { label: 'আজকের ক্লাস শিডিউলার দেখুন', route: '#/classes' }
      } else if (q.includes('বকেয়া') || q.includes('ফি') || q.includes('টাকা') || q.includes('fee')) {
        replyText = `চলতি মাসে মোট সংগৃহীত ফি ৳ ${finance.monthCollected.toLocaleString()}। মোট বিল ৳ ${finance.monthBilled.toLocaleString()} (আদায়ের হার ${finance.monthCollectionPct}%)। বকেয়া ইনভয়েস রয়েছে ${finance.unpaidInvoices.length}টি, যার মোট পরিমাণ ৳ ${finance.totalOutstanding.toLocaleString()}।`
        action = { label: 'ইনভয়েস খাতা ও তাগাদা SMS', route: '#/invoices' }
      } else if (q.includes('অনুপস্থিত') || q.includes('ফলো') || q.includes('absent')) {
        replyText = `শিক্ষার্থী উপস্থিতির সার্বিক গড় ${academic.attendanceStats.avgPct ?? 94}%। ৭-ক্লাস অনুপস্থিতি নীতিমালায় কোনো গুরুতর ড্রপ-আউট এড়াতে ১-ক্লিক SMS ও WhatsApp ফলো-আপ বাটন ব্যবহার করার পরামর্শ দেওয়া হচ্ছে।`
        action = { label: 'অনুপস্থিতি ফলো-আপ রেজিস্টার', route: '#/followups' }
      } else if (q.includes('স্টার') || q.includes('সেরা') || q.includes('ছাত্র') || q.includes('star')) {
        const top = starStudents.slice(0, 3).map((s) => `${s.rank}ম: ${s.student_name} (${s.batch_name}) - ${s.score}/১০০`).join('\n')
        replyText = `চলতি মাসের সেরা শিক্ষার্থীরা হলেন:\n${top}\n\nদৈনিক সবক, সাত সবক এবং মাসিক মূল্যায়নের ভিত্তিতে এই ক্রম নির্ধারণ করা হয়েছে।`
        action = { label: 'সম্মাননা বোর্ড ও পরীক্ষা নম্বরপত্র', route: '#/exams' }
      } else if (q.includes('বেতন') || q.includes('শিক্ষক') || q.includes('payable')) {
        replyText = `চলতি মাসে শিক্ষক ও স্টাফদের মোট প্রদেয় বেতন ৳ ${finance.monthPayablesTotal.toLocaleString()}। অনুমোদনের অপেক্ষায় থাকা স্লিপ ${finance.pendingPayables.length}টি (৳ ${finance.pendingPayablesSum.toLocaleString()})।`
        action = { label: 'শিক্ষক বেতন অনুমোদন পেজ', route: '#/payables' }
      } else {
        replyText = `আপনার প্রশ্নের প্রেক্ষিতে অ্যাকাডেমির লাইভ ডাটা পর্যবেক্ষণ করা হয়েছে। বর্তমানে ${academic.todayClasses.length}টি ক্লাস, ${finance.unpaidInvoices.length}টি বকেয়া ইনভয়েস এবং ৳ ${finance.monthCollected.toLocaleString()} আদায় রের্কড রয়েছে। বিস্তারিত জানতে নিচের বাটনে ক্লিক করুন।`
        action = { label: 'ড্যাশবোর্ড ওভারভিউ', route: '#/dashboard' }
      }

      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: replyText,
        action,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, botMsg])
    }, 450)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">ইতকান অ্যাকাডেমি এআই সহকারী</h2>
              <p className="text-[11px] text-teal-200/80">লাইভ ডাটা অ্যানালাইটিক্স ও রিপোর্ট বট</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Query Pills */}
        <div className="p-3 bg-slate-50 border-b border-border/80 overflow-x-auto flex gap-1.5 no-scrollbar flex-shrink-0">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleAsk(q)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-semibold text-slate-700 hover:border-primary-400 hover:text-primary-800 transition-colors whitespace-nowrap cursor-pointer shadow-3xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 shadow-3xs ${
                  m.sender === 'user'
                    ? 'bg-primary-700 text-white'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[82%] space-y-2`}>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary-700 text-white rounded-tr-xs'
                      : 'bg-bg border border-border text-heading rounded-tl-xs shadow-3xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.action && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          navigateTo(m.action!.route)
                          onClose()
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:underline cursor-pointer"
                      >
                        <span>{m.action.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className={`text-[10px] text-muted ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.timestamp}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Drawer Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAsk(input)
          }}
          className="p-3 bg-surface border-t border-border flex items-center gap-2 flex-shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="অ্যাকাডেমির ডাটা সম্পর্কে কিছু জানতে চান?..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-bg focus:outline-none focus:ring-2 focus:ring-primary-700/25 focus:border-primary-700 transition-all"
          />
          <Button type="submit" size="sm" disabled={!input.trim()} className="px-3">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
