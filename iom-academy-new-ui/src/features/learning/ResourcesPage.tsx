import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DialogModal } from '@/components/ui/DialogModal'
import { useToast } from '@/components/ui/Toast'
import { buildWhatsAppUrl, buildTelegramShareUrl } from '@/lib/messaging'
import {
  useLocalStore,
  BOOKSHELF_VAULT_KEY,
  DEFAULT_BOOKSHELF_ITEMS,
  type BookshelfItem,
} from '@/lib/superAdminStore'
import {
  BookOpen, FolderOpen, Plus, ExternalLink, MessageCircle, Send, Search,
  Trash2, Library, BookMarked, Sparkles, Layers,
} from 'lucide-react'

// Category labels and theme styles
const CATEGORY_META: Record<BookshelfItem['category'], { label: string; icon: string }> = {
  quran: { label: 'কুরআনুল কারীম', icon: '📖' },
  tajweed: { label: 'তাজবীদ ও কিরাত', icon: '🎙️' },
  kitab: { label: 'পাঠ্যবই ও কায়েদা', icon: '📗' },
  dua_hadith: { label: 'মাসআলা ও দুআ', icon: '🤲' },
  worksheet: { label: 'অনুশীলন শিট', icon: '📝' },
  syllabus: { label: 'সিলেবাস ও রুটিন', icon: '📋' },
}

const COVER_STYLES: Record<BookshelfItem['cover_theme'], {
  bg: string
  spine: string
  border: string
  accent: string
  badgeBg: string
}> = {
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-900 via-[#0f3e32] to-emerald-950 text-emerald-50',
    spine: 'bg-emerald-800 border-r border-emerald-600/40',
    border: 'border-emerald-600/50 shadow-emerald-950/20',
    accent: 'text-amber-300',
    badgeBg: 'bg-emerald-950/60 text-emerald-200 border-emerald-500/30',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 text-amber-50',
    spine: 'bg-amber-700 border-r border-amber-500/40',
    border: 'border-amber-600/50 shadow-amber-950/20',
    accent: 'text-amber-200',
    badgeBg: 'bg-amber-950/60 text-amber-200 border-amber-500/30',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-900 via-primary-800 to-slate-950 text-blue-50',
    spine: 'bg-blue-700 border-r border-blue-500/40',
    border: 'border-blue-500/50 shadow-blue-950/20',
    accent: 'text-sky-300',
    badgeBg: 'bg-blue-950/60 text-blue-200 border-blue-500/30',
  },
  crimson: {
    bg: 'bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950 text-rose-50',
    spine: 'bg-rose-800 border-r border-rose-600/40',
    border: 'border-rose-600/50 shadow-rose-950/20',
    accent: 'text-amber-200',
    badgeBg: 'bg-rose-950/60 text-rose-200 border-rose-500/30',
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 text-indigo-50',
    spine: 'bg-indigo-800 border-r border-indigo-600/40',
    border: 'border-indigo-600/50 shadow-indigo-950/20',
    accent: 'text-indigo-200',
    badgeBg: 'bg-indigo-950/60 text-indigo-200 border-indigo-500/30',
  },
}

// Predefined shelf drawers
const SHELF_DRAWERS = [
  { id: 'all', label: 'সকল কুতুবখানা', icon: Library, hint: 'পুরো একাডেমির সকল কিতাব ও ফাইল' },
  { id: '3', label: 'হিফজুল কুরআন ড্রয়ার', icon: BookOpen, hint: '১:১ ও গ্রুপ হিফজ ব্যাচের জন্য' },
  { id: '1', label: 'তাজবীদ ড্রয়ার', icon: BookMarked, hint: 'তাজবীদ ব্যাচ ১ ও বিশেষ মশ্ক' },
  { id: '2', label: 'নাজেরা ড্রয়ার', icon: FolderOpen, hint: 'নাজেরা সান্ধ্যকালীন ব্যাচ' },
  { id: '4', label: '১:১ প্রাইভেট স্লট', icon: Layers, hint: 'একান্ত তিলাওয়াত ও প্রাইভেট ড্রিল' },
]

export default function ResourcesPage({ role }: { role: string }) {
  const canManage = ['central_admin', 'branch_admin', 'zimmadar', 'teacher'].includes(role)
  const toast = useToast()

  const [books, setBooks] = useLocalStore<BookshelfItem[]>(BOOKSHELF_VAULT_KEY, DEFAULT_BOOKSHELF_ITEMS)
  const [activeDrawer, setActiveDrawer] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Add Book Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newArabicTitle, setNewArabicTitle] = useState('')
  const [newBatchId, setNewBatchId] = useState('3')
  const [newCategory, setNewCategory] = useState<BookshelfItem['category']>('quran')
  const [newAuthor, setNewAuthor] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newFileType, setNewFileType] = useState<BookshelfItem['file_type']>('pdf')
  const [newFileSize, setNewFileSize] = useState('')
  const [newCoverTheme, setNewCoverTheme] = useState<BookshelfItem['cover_theme']>('emerald')
  const [newDescription, setNewDescription] = useState('')

  // Filtered books on the bookshelf
  const shelfBooks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return books.filter((b) => {
      // Drawer filter
      if (activeDrawer !== 'all') {
        if (b.batch_id !== 'all' && b.batch_id !== activeDrawer) return false
      }
      // Category filter
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false
      // Text search
      if (!q) return true
      return (
        b.title.toLowerCase().includes(q) ||
        (b.arabic_title && b.arabic_title.includes(q)) ||
        b.batch_label.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
      )
    })
  }, [books, activeDrawer, categoryFilter, search])

  // Drawer counts
  const drawerCounts = useMemo(() => {
    const map: Record<string, number> = { all: books.length }
    for (const b of books) {
      map[b.batch_id] = (map[b.batch_id] || 0) + 1
    }
    return map
  }, [books])

  function handleAddBook(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.warning('দয়া করে কিতাবের নাম ও লিংক প্রদান করুন।')
      return
    }

    const drawer = SHELF_DRAWERS.find((d) => d.id === newBatchId)
    const newBook: BookshelfItem = {
      id: `book-${Date.now()}`,
      title: newTitle.trim(),
      arabic_title: newArabicTitle.trim() || undefined,
      batch_id: newBatchId,
      batch_label: drawer ? drawer.label : 'ব্যাচ লাইব্রেরি',
      category: newCategory,
      author: newAuthor.trim() || 'আইওএম ইতকান একাডেমি',
      file_url: newUrl.trim(),
      file_type: newFileType,
      file_size: newFileSize.trim() || (newFileType === 'pdf' ? 'PDF' : 'ফাইল'),
      cover_theme: newCoverTheme,
      description: newDescription.trim() || undefined,
      uploaded_by: role === 'central_admin' ? 'প্রকৌশলী রফিকুল ইসলাম (অ্যাডমিন)' : 'একাডেমিক উস্তাদ',
      created_at: new Date().toISOString(),
    }

    setBooks([newBook, ...books])
    setShowAddModal(false)
    setNewTitle('')
    setNewArabicTitle('')
    setNewUrl('')
    setNewAuthor('')
    setNewFileSize('')
    setNewDescription('')
    toast.success('নতুন কিতাব বুকশেলফে সফলভাবে যুক্ত হয়েছে!')
  }

  function handleDeleteBook(id: string, title: string) {
    if (!window.confirm(`আপনি কি "${title}" কিতাবটি বুকশেলফ থেকে মুছে ফেলতে চান?`)) return
    setBooks(books.filter((b) => b.id !== id))
    toast.success('বুকশেলফ থেকে কিতাব মুছে ফেলা হয়েছে।')
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      {/* ── HEADER WITH ACTIONS ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-amber-950 via-[#0f3e32] to-slate-900 text-white p-6 rounded-2xl shadow-md border border-amber-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Library className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>আইওএম ইতকান ডিজিটাল কুতুবখানা ও কিতাবের তাক</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>📚 ব্যাচভিত্তিক ডিজিটাল বুকশেলফ ও লাইব্রেরি ভল্ট</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            প্রত্যেকটি ব্যাচের জন্য আলাদা তাক ও ড্রয়ার রাখা হয়েছে—যেখান থেকে শিক্ষক, অভিভাবক ও শিক্ষার্থীরা সরাসরি প্রয়োজনীয় কিতাব, তাজবীদ শিট ও অডিও লেকচার পড়তে ও ডাউনলোড করতে পারবেন।
          </p>
        </div>

        {canManage && (
          <div className="relative z-10">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-xl text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন কিতাব / ফাইল আপলোড করুন</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── SHELF DRAWERS (ব্যাচভিত্তিক ড্রয়ার ও তাকে ক্যাবিনেট) ───────────── */}
      <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-3 shadow-inner">
        <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>বুকশেলফের তাক ও ব্যাচ ড্রয়ার নির্বাচন করুন:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SHELF_DRAWERS.map((drawer) => {
            const Icon = drawer.icon
            const isActive = activeDrawer === drawer.id
            const count = drawer.id === 'all' ? books.length : (drawerCounts[drawer.id] || 0)

            return (
              <button
                key={drawer.id}
                type="button"
                onClick={() => setActiveDrawer(drawer.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-b from-amber-900 to-amber-950 text-white border-amber-600 shadow-md ring-2 ring-amber-500/40 translate-y-[-2px]'
                    : 'bg-surface hover:bg-amber-50/50 text-heading border-border hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-amber-500 text-amber-950' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-400/30 text-amber-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count} টি কিতাব
                  </span>
                </div>
                <p className="font-bold text-xs truncate">{drawer.label}</p>
                <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-amber-200/80' : 'text-muted'}`}>
                  {drawer.hint}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ────────────────────────────────────────── */}
      <Card className="rounded-2xl border-border shadow-2xs">
        <CardContent className="py-3 px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                categoryFilter === 'all'
                  ? 'bg-primary-700 text-white border-primary-700 shadow-3xs'
                  : 'bg-surface text-body border-border hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              সকল ক্যাটাগরি ({shelfBooks.length})
            </button>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  categoryFilter === key
                    ? 'bg-primary-700 text-white border-primary-700 shadow-3xs'
                    : 'bg-surface text-body border-border hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="কিতাব বা বিষয়ের নাম খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── BOOKSHELF RACK (কাঠের তাকের ডিজাইন ও কিতাবসমূহ) ─────────────── */}
      <div className="bg-gradient-to-b from-amber-950/10 via-amber-900/5 to-amber-950/15 p-4 sm:p-6 rounded-3xl border border-amber-900/30 shadow-md">
        {shelfBooks.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-heading">এই তাকে কোনো কিতাব বা ফাইল পাওয়া যায়নি</h3>
            <p className="text-xs text-muted max-w-md mx-auto mt-1 mb-4">
              অন্য কোনো ড্রয়ার নির্বাচন করুন অথবা ওপরের &quot;+ নতুন কিতাব আপলোড করুন&quot; বাটনে ক্লিক করে পাঠ্যবই যুক্ত করুন।
            </p>
            {canManage && (
              <Button size="sm" onClick={() => setShowAddModal(true)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> এখনই ফাইল আপলোড করুন
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Shelf Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {shelfBooks.map((book) => {
                const style = COVER_STYLES[book.cover_theme] || COVER_STYLES.emerald
                const categoryMeta = CATEGORY_META[book.category] || CATEGORY_META.quran
                const shareText = `*আইওএম ইতকান একাডেমি কুতুবখানা*\nবই: ${book.title}\nক্যাটাগরি: ${categoryMeta.label}\nব্যাচ: ${book.batch_label}\nলিংক: ${book.file_url}`

                return (
                  <div
                    key={book.id}
                    className="group flex flex-col justify-between rounded-2xl overflow-hidden border border-border/80 bg-surface shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1.5"
                  >
                    {/* Realistic Book Cover Visual */}
                    <div className={`p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[210px] ${style.bg} ${style.border}`}>
                      {/* Left spine shadow */}
                      <div className={`absolute left-0 top-0 bottom-0 w-3 ${style.spine} opacity-75`} />

                      {/* Header in Book */}
                      <div className="pl-2">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-xs flex items-center gap-1 ${style.badgeBg}`}>
                            <span>{categoryMeta.icon}</span>
                            <span>{categoryMeta.label}</span>
                          </span>
                          <span className="text-[10px] font-mono text-white/80 bg-black/30 px-1.5 py-0.5 rounded">
                            {book.file_size || book.file_type.toUpperCase()}
                          </span>
                        </div>

                        {book.arabic_title && (
                          <p className={`font-serif text-xs text-right opacity-90 truncate tracking-wide ${style.accent}`}>
                            {book.arabic_title}
                          </p>
                        )}
                      </div>

                      {/* Main Title on Book Cover */}
                      <div className="pl-2 my-auto py-2">
                        <h3 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-2 text-white drop-shadow-xs">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-[11px] text-white/75 truncate mt-1">
                            লেখক/সংকলক: {book.author}
                          </p>
                        )}
                      </div>

                      {/* Footer on Cover */}
                      <div className="pl-2 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
                        <span className="truncate max-w-[130px]">{book.batch_label}</span>
                        <span>{book.file_type === 'audio' ? '🎧 অডিও' : '📄 PDF'}</span>
                      </div>
                    </div>

                    {/* Book Information & Actions underneath */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5 bg-surface">
                      {book.description ? (
                        <p className="text-xs text-muted leading-relaxed line-clamp-2">
                          {book.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted/60 italic">
                          একাডেমিক ক্লাসের নিয়মিত অধ্যয়ন ও বাড়ির কাজের সহায়ক সামগ্রী।
                        </p>
                      )}

                      <div className="pt-2 border-t border-border flex items-center justify-between gap-1.5 flex-wrap">
                        {/* Open Button */}
                        <a
                          href={book.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-3xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>পড়ুন / ওপেন</span>
                        </a>

                        <div className="flex items-center gap-1">
                          {/* Share on WhatsApp */}
                          <a
                            href={buildWhatsAppUrl(shareText)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="হোয়াটসঅ্যাপে শেয়ার করুন"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Share on Telegram */}
                          <a
                            href={buildTelegramShareUrl(shareText, book.file_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                            title="টেলিগ্রামে শেয়ার করুন"
                          >
                            <Send className="w-4 h-4" />
                          </a>

                          {/* Delete Button (for Admin) */}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="তাক থেকে মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Realistic Wooden Shelf Base Planks */}
            <div className="h-4 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full shadow-lg border-b-2 border-amber-800" />
          </div>
        )}
      </div>

      {/* ── UPLOAD / ADD BOOK MODAL (DialogModal) ───────────────────────── */}
      <DialogModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="বুকশেলফে নতুন কিতাব বা স্টাডি ফাইল যুক্ত করুন"
        subtitle="সংশ্লিষ্ট ব্যাচের শিক্ষার্থীরা সরাসরি তাদের পোর্টাল ও লাইব্রেরিতে এটি দেখতে পাবে"
        icon={<BookOpen className="w-5 h-5" />}
        maxWidth="2xl"
      >
        <form onSubmit={handleAddBook} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">
                কিতাব / ফাইলের নাম *
              </label>
              <Input
                required
                placeholder="যেমন: সহজ নূরানী কায়দা ৩য় সংস্করণ"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">
                আরবি শিরোনাম / কভার টেক্সট
              </label>
              <Input
                placeholder="যেমন: القاعدة النورانية"
                value={newArabicTitle}
                onChange={(e) => setNewArabicTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">
                সংশ্লিষ্ট ব্যাচ ড্রয়ার নির্বাচন *
              </label>
              <select
                value={newBatchId}
                onChange={(e) => setNewBatchId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-border bg-surface"
              >
                <option value="all">সাধারণ কুতুবখানা (সকল ব্যাচ)</option>
                <option value="3">১:১ হিফজ সান্ধ্যকালীন বিশেষ স্লট</option>
                <option value="1">তাজবীদ ব্যাচ ১ (সকাল ৭:০০ - ৮:০০)</option>
                <option value="2">নাজেরা সান্ধ্যকালীন ব্যাচ (বিকাল ৫:০০ - ৬:০০)</option>
                <option value="4">১:১ তাজবীদ সকালের প্রাইভেট স্লট</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-heading block mb-1">
                ক্যাটাগরি *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as BookshelfItem['category'])}
                className="w-full text-xs py-2 px-3 rounded-xl border border-border bg-surface"
              >
                <option value="quran">📖 কুরআনুল কারীম</option>
                <option value="tajweed">🎙️ তাজবীদ ও কিরাত</option>
                <option value="kitab">📗 পাঠ্যবই ও কায়েদা</option>
                <option value="dua_hadith">🤲 মাসআলা ও দুআ</option>
                <option value="worksheet">📝 অনুশীলন শিট ও খাতা</option>
                <option value="syllabus">📋 বার্ষিক সিলেবাস ও রুটিন</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">
                লেখক / প্রকাশনী
              </label>
              <Input
                placeholder="মুফতী আবরারুল হক"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">
                ফাইলের ধরন
              </label>
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value as BookshelfItem['file_type'])}
                className="w-full text-xs py-2 px-3 rounded-xl border border-border bg-surface"
              >
                <option value="pdf">📄 PDF ডকুমেন্ট</option>
                <option value="doc">📝 Word / DOCX</option>
                <option value="audio">🎧 অডিও লেকচার</option>
                <option value="link">🔗 ড্রাইভ / ওয়েবসাইট লিঙ্ক</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">
                ফাইল সাইজ / পৃষ্ঠা
              </label>
              <Input
                placeholder="যেমন: ১২.৪ MB বা ১২০ পৃষ্ঠা"
                value={newFileSize}
                onChange={(e) => setNewFileSize(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-heading block mb-1">
              ডাউনলোড বা ড্রাইভ লিঙ্ক (URL) *
            </label>
            <Input
              required
              type="url"
              placeholder="https://drive.google.com/... অথবা PDF লিঙ্ক"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-heading block mb-1">
              বুকশেলফ কভার কালার থিম
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['emerald', 'amber', 'blue', 'crimson', 'indigo'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewCoverTheme(t)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border capitalize transition-transform cursor-pointer ${
                    newCoverTheme === t
                      ? 'ring-2 ring-primary-600 scale-102 shadow-xs'
                      : 'opacity-80 hover:opacity-100'
                  } ${
                    t === 'emerald' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
                    t === 'amber' ? 'bg-amber-900 text-amber-100 border-amber-700' :
                    t === 'blue' ? 'bg-blue-900 text-blue-100 border-blue-700' :
                    t === 'crimson' ? 'bg-rose-950 text-rose-100 border-rose-800' :
                    'bg-indigo-950 text-indigo-100 border-indigo-800'
                  }`}
                >
                  {t === 'emerald' ? 'সবুজ' : t === 'amber' ? 'সোনালী' : t === 'blue' ? 'নীল' : t === 'crimson' ? 'মেরুন' : 'বেগুনী'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-heading block mb-1">
              শিক্ষার্থীদের পড়ার নির্দেশনা বা সংক্ষিপ্ত বিবরণ
            </label>
            <textarea
              rows={2}
              placeholder="কোন পৃষ্ঠা পড়তে হবে বা কীভাবে অনুশীলন করতে হবে তার সংক্ষিপ্ত পরামর্শ..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              বাতিল
            </Button>
            <Button type="submit" className="bg-primary-700 text-white font-bold">
              বুকশেলফে প্রকাশ করুন
            </Button>
          </div>
        </form>
      </DialogModal>
    </div>
  )
}
