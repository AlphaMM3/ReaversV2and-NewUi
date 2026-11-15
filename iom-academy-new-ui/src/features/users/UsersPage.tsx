import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Power,
  Lock,
  Unlock,
  Phone,
  MessageSquare,
  Clock,
  Laptop,
  Star,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  LayoutGrid,
  List,
  Check,
  Copy,
  X,
  UserCheck,
} from 'lucide-react'
import type { CurrentUser } from '@/lib/api'
import { api } from '@/lib/api'
import {
  useLocalStore,
  USER_ACCOUNTS_KEY,
  DEFAULT_USER_PROFILES,
  type UserProfileRecord,
  RBAC_STORAGE_KEY,
  DEFAULT_RBAC_PERMISSIONS,
  type PolicyRole,
} from '@/lib/superAdminStore'
import { cn, initials, avatarColor } from '@/lib/utils'

interface UsersPageProps {
  user: CurrentUser
  role: string
}

type ViewMode = 'grid' | 'list'
type RoleFilter = 'all' | 'zimmadar' | 'teacher' | 'guardian' | 'student' | 'admin'
type StatusFilter = 'all' | 'online' | 'active' | 'fee_hold' | 'inactive'

export default function UsersPage({ user, role }: UsersPageProps) {
  // Store of all user profiles with presence and fee status
  const [users, setUsers] = useLocalStore<UserProfileRecord[]>(
    USER_ACCOUNTS_KEY,
    DEFAULT_USER_PROFILES,
  )

  // RBAC permissions to check if Zimmadars have user suspension permission
  const [rbacPermissions] = useLocalStore(RBAC_STORAGE_KEY, DEFAULT_RBAC_PERMISSIONS)

  // View & Filter states
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')

  // Selected for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal & Drawer states
  const [selectedUser, setSelectedUser] = useState<UserProfileRecord | null>(null)
  const [feeHoldTarget, setFeeHoldTarget] = useState<UserProfileRecord | null>(null)
  const [feeHoldAmount, setFeeHoldAmount] = useState('2500')
  const [feeHoldReason, setFeeHoldReason] = useState('নভেম্বর ২০২৬ মাসের টিউশন ফি অপরিশোধিত')
  const [feeHoldNote, setFeeHoldNote] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Check if current user has permission to toggle ID active/deactive and fee hold
  const isSuperAdmin = role === 'central_admin' || role === 'branch_admin'
  const canManageUsers = useMemo(() => {
    if (isSuperAdmin) return true
    const perm = rbacPermissions.find((p) => p.id === 'manage_user_status_fee_hold')
    if (perm && role in perm.roles) {
      return Boolean(perm.roles[role as PolicyRole])
    }
    return role === 'zimmadar' // Default enabled for Zimmadars unless revoked
  }, [role, isSuperAdmin, rbacPermissions])

  // Toggle favorite star
  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isStarred: !u.isStarred } : u)),
    )
  }

  // Toggle Selection
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle Active / Deactive status
  const handleToggleStatus = async (target: UserProfileRecord) => {
    if (!canManageUsers) return

    const newStatus =
      target.status === 'active' ? 'inactive' : 'active'

    // Update in local store
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? {
              ...u,
              status: newStatus,
              feeHoldReason: newStatus === 'active' ? undefined : u.feeHoldReason,
              feeHoldDate: newStatus === 'active' ? undefined : u.feeHoldDate,
            }
          : u,
      ),
    )

    // Sync with backend API if backend user id exists
    if (target.backendUserId) {
      try {
        await api.patch(`/users/${target.backendUserId}`, {
          active: newStatus === 'active' ? 1 : 0,
          reason: newStatus === 'active' ? 'Account activated' : 'Account deactivated by staff',
        })
      } catch (err) {
        console.warn('Backend sync warning:', err)
      }
    }
  }

  // Apply Fee Hold & Suspend ID
  const handleConfirmFeeHold = async () => {
    if (!feeHoldTarget || !canManageUsers) return

    const holdReasonText = `${feeHoldReason}${feeHoldNote ? ` (${feeHoldNote})` : ''}`
    const todayStr = new Date().toISOString().split('T')[0]

    setUsers((prev) =>
      prev.map((u) =>
        u.id === feeHoldTarget.id
          ? {
              ...u,
              status: 'fee_hold',
              feeDueAmount: Number(feeHoldAmount) || 2500,
              feeHoldReason: holdReasonText,
              feeHoldDate: todayStr,
              feeHoldBy: `${user.name} (${role === 'central_admin' ? 'সুপার অ্যাডমিন' : 'জিম্মাদার'})`,
            }
          : u,
      ),
    )

    // Sync with backend API
    if (feeHoldTarget.backendUserId) {
      try {
        await api.patch(`/users/${feeHoldTarget.backendUserId}`, {
          active: 0,
          reason: `Fee Hold: ${holdReasonText}`,
        })
      } catch (err) {
        console.warn('Backend sync warning:', err)
      }
    }

    setFeeHoldTarget(null)
  }

  // 1-Click Fee Unlock
  const handleClearFeeHold = async (target: UserProfileRecord) => {
    if (!canManageUsers) return

    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? {
              ...u,
              status: 'active',
              feeDueAmount: 0,
              feeHoldReason: undefined,
              feeHoldDate: undefined,
              feeHoldBy: undefined,
            }
          : u,
      ),
    )

    if (target.backendUserId) {
      try {
        await api.patch(`/users/${target.backendUserId}`, {
          active: 1,
          reason: 'Fee cleared — Account reactivated',
        })
      } catch (err) {
        console.warn('Backend sync warning:', err)
      }
    }
  }

  // Copy to clipboard helper
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role match
      if (roleFilter === 'zimmadar' && u.role !== 'zimmadar') return false
      if (roleFilter === 'teacher' && u.role !== 'teacher') return false
      if (roleFilter === 'guardian' && u.role !== 'guardian') return false
      if (roleFilter === 'student' && u.role !== 'student') return false
      if (
        roleFilter === 'admin' &&
        u.role !== 'central_admin' &&
        u.role !== 'branch_admin'
      )
        return false

      // Status match
      if (statusFilter === 'online' && !u.isOnline) return false
      if (statusFilter === 'active' && u.status !== 'active') return false
      if (statusFilter === 'fee_hold' && u.status !== 'fee_hold') return false
      if (statusFilter === 'inactive' && u.status !== 'inactive') return false

      // Department match
      if (deptFilter !== 'all' && u.department !== deptFilter) return false

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchesName = u.name.toLowerCase().includes(q)
        const matchesPhone = u.phone.toLowerCase().includes(q)
        const matchesEmail = u.email.toLowerCase().includes(q)
        const matchesBatch = u.linkedBatch?.toLowerCase().includes(q)
        const matchesWard = u.linkedStudentNames?.some((s) =>
          s.toLowerCase().includes(q),
        )
        const matchesGuardian = u.linkedGuardianName?.toLowerCase().includes(q)
        if (
          !matchesName &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesBatch &&
          !matchesWard &&
          !matchesGuardian
        )
          return false
      }

      return true
    })
  }, [users, roleFilter, statusFilter, deptFilter, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = users.length
    const online = users.filter((u) => u.isOnline).length
    const feeHold = users.filter((u) => u.status === 'fee_hold').length
    const staffCount = users.filter((u) =>
      ['central_admin', 'branch_admin', 'zimmadar', 'teacher'].includes(u.role),
    ).length
    return { total, online, feeHold, staffCount }
  }, [users])

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(users.map((u) => u.department))
    return Array.from(set).filter(Boolean)
  }, [users])

  return (
    <div className="w-full max-w-[1680px] mx-auto p-4 sm:p-6 space-y-6">
      {/* ── TOP HEADER (TITLE + VIEW TOGGLE) ────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center text-white shadow-md shadow-primary-950/20 ring-1 ring-white/20">
            <Users className="w-5 h-5 text-amber-300 drop-shadow-xs" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 font-heading tracking-tight">
                Users <span className="text-primary-700 text-lg font-bold">· ব্যবহারকারী ও এক্সেস</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                মোট {users.length} জন
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              সকল শিক্ষক, জিম্মাদার, অভিভাবক ও শিক্ষার্থীর উপস্থিতি, প্রোফাইল এবং বকেয়া ফি জনিত আইডি কন্ট্রোল
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Permission Status Pill */}
          <div
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border shadow-3xs',
              canManageUsers
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200',
            )}
          >
            {canManageUsers ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>আইডি নিয়ন্ত্রণ: অনুমোদিত</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>শুধুমাত্র দেখার এক্সেস</span>
              </>
            )}
          </div>

          {/* List View / Grid View Switcher (Matches Uploaded Screenshot!) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>

          {/* Add User Button */}
          {canManageUsers && (
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 shadow-xs shadow-primary-700/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নতুন ইউজার</span>
            </button>
          )}
        </div>
      </div>

      {/* ── SUMMARY STATS BANNER ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">মোট ব্যবহারকারী</p>
            <p className="text-xl font-black text-slate-900 font-heading">{metrics.total} জন</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold relative">
            <Clock className="w-5 h-5" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse absolute -top-0.5 -right-0.5 ring-2 ring-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">এখন অনলাইন (Live)</p>
            <p className="text-xl font-black text-emerald-700 font-heading">{metrics.online} জন</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">ফি বকেয়া স্থগিত আইডি</p>
            <p className="text-xl font-black text-amber-700 font-heading">{metrics.feeHold} জন</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">শিক্ষক ও জিম্মাদার</p>
            <p className="text-xl font-black text-indigo-900 font-heading">{metrics.staffCount} জন</p>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-3xs space-y-3.5">
        {/* Row 1: Search & Dropdowns */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="নাম, ফোন, ইমেইল, ব্যাচ বা সন্তানের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-auto text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-primary-500"
            >
              <option value="all">সকল বিভাগ (All Departments)</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Role Category Tabs & Status Chips */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Role Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'all', label: 'সকল ইউজার' },
              { key: 'zimmadar', label: 'জিম্মাদার' },
              { key: 'teacher', label: 'শিক্ষকবৃন্দ' },
              { key: 'guardian', label: 'অভিভাবক' },
              { key: 'student', label: 'শিক্ষার্থী' },
              { key: 'admin', label: 'অ্যাডমিন' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setRoleFilter(tab.key as RoleFilter)
                  setCurrentPage(1)
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                  roleFilter === tab.key
                    ? 'bg-primary-700 text-white shadow-xs shadow-primary-700/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Quick Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> ফিল্টার:
            </span>
            {[
              { key: 'all', label: 'সব স্ট্যাটাস' },
              { key: 'online', label: '🟢 লাইভ অনলাইন' },
              { key: 'fee_hold', label: '⚠️ ফি বকেয়া হোল্ড' },
              { key: 'inactive', label: '⚪ নিষ্ক্রিয়' },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  setStatusFilter(chip.key as StatusFilter)
                  setCurrentPage(1)
                }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                  statusFilter === chip.key
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECURITY / PERMISSION BANNER FOR ZIMMADARS ──────────────── */}
      {!canManageUsers && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">আইডি সক্রিয়/স্থগিত করার ক্ষমতা সীমাবদ্ধ</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              সুপার অ্যাডমিন 'Roles & Permissions' ম্যাট্রিক্স থেকে জিম্মাদারদের জন্য <strong>"আইডি সক্রিয়/স্থগিত ও বকেয়া ফি লক"</strong> ক্ষমতা বরাদ্দ করলে আপনি শিক্ষার্থীদের অ্যাকাউন্ট সাময়িক হোল্ড করতে পারবেন।
            </p>
          </div>
        </div>
      )}

      {/* ── CONTENT: GRID VIEW (MATCHING REFERENCE IMAGE) ──────────── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {paginatedUsers.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/80">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-1">অন্য কোনো ফিল্টার বা সার্চ অপশন ব্যবহার করুন</p>
            </div>
          ) : (
            paginatedUsers.map((u) => {
              const isSelected = selectedIds.has(u.id)
              const bg = u.avatarColor || avatarColor(u.name)

              return (
                <div
                  key={u.id}
                  className={cn(
                    'bg-white rounded-2xl border transition-all p-5 flex flex-col items-center text-center relative group hover:shadow-lg',
                    u.status === 'fee_hold'
                      ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/20 to-white'
                      : u.status === 'inactive'
                        ? 'border-slate-200 bg-slate-50/30 opacity-80'
                        : isSelected
                          ? 'border-primary-500 ring-2 ring-primary-500/15'
                          : 'border-slate-200/90 hover:border-slate-300',
                  )}
                >
                  {/* Top Bar: Checkbox, Star & 3-Dot Menu */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(u.id, e)}
                        className={cn(
                          'w-4 h-4 rounded border transition-colors flex items-center justify-center cursor-pointer',
                          isSelected
                            ? 'bg-primary-700 border-primary-700 text-white'
                            : 'border-slate-300 hover:border-slate-400 bg-white',
                        )}
                        aria-label="Select user"
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => toggleStar(u.id, e)}
                        className="text-slate-300 hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                        title={u.isStarred ? 'ফেভারিট সরানো' : 'ফেভারিট করা'}
                      >
                        <Star
                          className={cn(
                            'w-4 h-4',
                            u.isStarred && 'text-amber-400 fill-amber-400',
                          )}
                        />
                      </button>
                    </div>

                    {/* 3-Dot Action Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuId(activeMenuId === u.id ? null : u.id)
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === u.id && (
                        <div
                          className="absolute right-0 top-7 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-left text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u)
                              setActiveMenuId(null)
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary-600" />
                            <span>সম্পূর্ণ প্রোফাইল দেখুন</span>
                          </button>

                          {canManageUsers && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleToggleStatus(u)
                                  setActiveMenuId(null)
                                }}
                                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5 text-slate-500" />
                                <span>
                                  {u.status === 'active' ? 'আইডি নিষ্ক্রিয় করুন' : 'আইডি সক্রিয় করুন'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setFeeHoldTarget(u)
                                  setActiveMenuId(null)
                                }}
                                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-amber-50 text-amber-800 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>বকেয়া ফি অনুযায়ী লক</span>
                              </button>
                            </>
                          )}

                          <a
                            href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `আসসালামু আলাইকুম ${u.name}, আইওএম ইতকান একাডেমি থেকে আপনার অ্যাকাডেমিক নোটিশ...`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-emerald-50 text-emerald-800 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>হোয়াটসঅ্যাপ নোটিশ</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Centered Circular Avatar with Live Presence Indicator */}
                  <div className="relative my-1">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-sm ring-4 ring-slate-100"
                      style={{ backgroundColor: bg }}
                    >
                      {initials(u.name)}
                    </div>

                    {/* Online Presence Dot */}
                    {u.isOnline ? (
                      <span
                        className="w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0 animate-pulse"
                        title="অনলাইন এখন (সক্রিয়)"
                      />
                    ) : (
                      <span
                        className="w-3.5 h-3.5 rounded-full bg-slate-300 ring-2 ring-white absolute bottom-0 right-0"
                        title="অফলাইন"
                      />
                    )}
                  </div>

                  {/* User Full Name */}
                  <h3
                    onClick={() => setSelectedUser(u)}
                    className="font-bold text-slate-900 text-[14.5px] leading-snug mt-2.5 truncate max-w-full hover:text-primary-700 cursor-pointer"
                    title={u.name}
                  >
                    {u.name}
                  </h3>

                  {/* Role / Designation Subtitle */}
                  <p className="text-xs text-slate-500 truncate max-w-full mt-0.5 font-medium">
                    {u.designation || u.roleBn}
                  </p>

                  {/* Department & Branch Tag */}
                  <div className="mt-1.5 flex items-center gap-1 justify-center max-w-full">
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[190px]">
                      {u.department}
                    </span>
                  </div>

                  {/* Status Badge & Fee Tag */}
                  <div className="mt-3 w-full flex flex-col items-center gap-1">
                    {u.status === 'fee_hold' ? (
                      <div className="w-full py-1 px-2 rounded-lg bg-amber-100/90 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 shadow-3xs">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>ফি বকেয়া: ৳{u.feeDueAmount.toLocaleString('bn-BD')} (স্থগিত)</span>
                      </div>
                    ) : u.status === 'active' ? (
                      <div className="py-0.5 px-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>আইডি সচল</span>
                      </div>
                    ) : (
                      <div className="py-0.5 px-2.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>আইডি নিষ্ক্রিয়</span>
                      </div>
                    )}

                    {/* Last Active Time */}
                    <p className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{u.lastActiveRelative}</span>
                    </p>
                  </div>

                  {/* Bottom Operational Switch & Quick Action */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 w-full flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="text-xs text-primary-700 hover:text-primary-900 font-semibold cursor-pointer"
                    >
                      প্রোফাইল ➔
                    </button>

                    {/* Quick Active/Inactive Toggle Switch */}
                    {canManageUsers && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] text-slate-400 font-medium">
                          {u.status === 'active' ? 'অন' : 'লক'}
                        </span>
                        <button
                          type="button"
                          disabled={!canManageUsers}
                          onClick={() => {
                            if (u.status === 'fee_hold') {
                              void handleClearFeeHold(u)
                            } else {
                              void handleToggleStatus(u)
                            }
                          }}
                          className={cn(
                            'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                            u.status === 'active' ? 'bg-emerald-600' : 'bg-slate-300',
                          )}
                          title={
                            u.status === 'active'
                              ? 'আইডি অফ করুন'
                              : u.status === 'fee_hold'
                                ? 'বকেয়া ক্লিয়ার ও আইডি চালু করুন'
                                : 'আইডি চালু করুন'
                          }
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                              u.status === 'active' ? 'translate-x-4' : 'translate-x-0',
                            )}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── CONTENT: LIST VIEW (DENSE DATA TABLE) ──────────────────── */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-3xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size > 0 &&
                        selectedIds.size === paginatedUsers.length
                      }
                      onChange={() => {
                        if (selectedIds.size === paginatedUsers.length) {
                          setSelectedIds(new Set())
                        } else {
                          setSelectedIds(new Set(paginatedUsers.map((u) => u.id)))
                        }
                      }}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="py-3 px-3">ব্যবহারকারী (User)</th>
                  <th className="py-3 px-3">রোল ও পদবী</th>
                  <th className="py-3 px-3">বিভাগ ও শাখা</th>
                  <th className="py-3 px-3">উপস্থিতি (Last Active)</th>
                  <th className="py-3 px-3">ফি অবস্থা</th>
                  <th className="py-3 px-3">আইডি স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      কোনো ফলাফল পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isSelected = selectedIds.has(u.id)
                    const bg = u.avatarColor || avatarColor(u.name)

                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          'hover:bg-slate-50/70 transition-colors',
                          u.status === 'fee_hold' && 'bg-amber-50/20',
                          isSelected && 'bg-primary-50/40',
                        )}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelect(u.id, e as unknown as React.MouseEvent)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex-shrink-0">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-3xs"
                                style={{ backgroundColor: bg }}
                              >
                                {initials(u.name)}
                              </div>
                              {u.isOnline && (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-0.5 -right-0.5 animate-pulse" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className="font-bold text-slate-900 hover:text-primary-700 text-left truncate block cursor-pointer"
                              >
                                {u.name}
                              </button>
                              <p className="text-[10.5px] text-slate-400 truncate">{u.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">{u.roleBn}</span>
                          <p className="text-[10.5px] text-slate-400 truncate">{u.designation}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700">{u.department}</span>
                          <p className="text-[10.5px] text-slate-400">{u.branchName}</p>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {u.isOnline ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                অনলাইন এখন
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">{u.lastActiveRelative}</span>
                            )}
                          </div>
                          {u.lastActivePage && (
                            <p className="text-[10px] text-slate-400 truncate">পেইজ: {u.lastActivePage}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {u.feeDueAmount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              বকেয়া: ৳{u.feeDueAmount.toLocaleString('bn-BD')}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-medium">পরিশোধিত</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {u.status === 'fee_hold' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-max">
                              <Lock className="w-3 h-3" /> ফি হোল্ড
                            </span>
                          ) : u.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" /> সচল
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-max">
                              নিষ্ক্রিয়
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Switch */}
                            {canManageUsers && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (u.status === 'fee_hold') {
                                    void handleClearFeeHold(u)
                                  } else {
                                    void handleToggleStatus(u)
                                  }
                                }}
                                className={cn(
                                  'relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                                  u.status === 'active' ? 'bg-emerald-600' : 'bg-slate-300',
                                )}
                                title={u.status === 'active' ? 'আইডি বন্ধ করুন' : 'আইডি চালু করুন'}
                              >
                                <span
                                  className={cn(
                                    'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out',
                                    u.status === 'active' ? 'translate-x-3' : 'translate-x-0',
                                  )}
                                />
                              </button>
                            )}

                            {/* View Profile */}
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="p-1 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
                              title="প্রোফাইল দেখুন"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Fee Hold Modal Trigger */}
                            {canManageUsers && (
                              <button
                                type="button"
                                onClick={() => setFeeHoldTarget(u)}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                title="বকেয়া ফি হোল্ড"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAGINATION BAR (MATCHING SCREENSHOT) ───────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <p>
          মোট <span className="font-bold text-slate-800">{filteredUsers.length}</span> জন ব্যবহারকারীর মধ্যে{' '}
          <span className="font-bold text-slate-800">
            {filteredUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          থেকে{' '}
          <span className="font-bold text-slate-800">
            {Math.min(currentPage * pageSize, filteredUsers.length)}
          </span>{' '}
          প্রদর্শিত হচ্ছে
        </p>

        {/* Page Buttons: < 1 2 3 ... 21 > */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer',
                    currentPage === pageNum
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {pageNum}
                </button>
              )
            }
            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return (
                <span key={pageNum} className="px-1 text-slate-400">
                  ...
                </span>
              )
            }
            return null
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MODAL: FEE OVERDUE HOLD (বকেয়া ফি জনিত আইডি স্থগিতকরণ) ───── */}
      {feeHoldTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    বকেয়া ফি অনুযায়ী আইডি স্থগিতকরণ
                  </h3>
                  <p className="text-xs text-slate-500">আইডি সাময়িক নিষ্ক্রিয় করার পূর্বে ফি বিবরণ নিশ্চিত করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeeHoldTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Profile Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: feeHoldTarget.avatarColor || avatarColor(feeHoldTarget.name) }}
              >
                {initials(feeHoldTarget.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{feeHoldTarget.name}</p>
                <p className="text-xs text-slate-500">{feeHoldTarget.roleBn} · {feeHoldTarget.phone}</p>
              </div>
            </div>

            {/* Fee Input Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বকেয়া ফির পরিমাণ (টাকা):
                </label>
                <input
                  type="number"
                  value={feeHoldAmount}
                  onChange={(e) => setFeeHoldAmount(e.target.value)}
                  className="w-full text-sm font-bold text-slate-900 px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-none"
                  placeholder="2500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  স্থগিতকরণের কারণ:
                </label>
                <select
                  value={feeHoldReason}
                  onChange={(e) => setFeeHoldReason(e.target.value)}
                  className="w-full text-xs text-slate-800 px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-none bg-white"
                >
                  <option value="নভেম্বর ২০২৬ মাসের টিউশন ফি অপরিশোধিত">
                    নভেম্বর ২০২৬ মাসের টিউশন ফি অপরিশোধিত
                  </option>
                  <option value="বিগত ২ মাসের মাসিক বেতন অপরিশোধিত">
                    বিগত ২ মাসের মাসিক বেতন অপরিশোধিত
                  </option>
                  <option value="ভর্তি বা রেজিস্ট্রেশন ফি বকেয়া">
                    ভর্তি বা রেজিস্ট্রেশন ফি বকেয়া
                  </option>
                  <option value="১:১ প্রাইভেট স্লটের ফি অনাদায়ী">
                    ১:১ প্রাইভেট স্লটের ফি অনাদায়ী
                  </option>
                  <option value="শৃঙ্খলাজনিত পর্যালোচনা সাপেক্ষে স্থগিত">
                    শৃঙ্খলাজনিত পর্যালোচনা সাপেক্ষে স্থগিত
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অভিভাবকের জন্য বিশেষ নোট (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={feeHoldNote}
                  onChange={(e) => setFeeHoldNote(e.target.value)}
                  placeholder="যেমন: আগামী ১৮ নভেম্বরের মধ্যে পরিশোধের অনুরোধ"
                  className="w-full text-xs text-slate-800 px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Notice Preview */}
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                অভিভাবক পোর্টালে যা প্রদর্শিত হবে:
              </p>
              <p className="text-[11px] text-amber-800">
                "সম্মানিত অভিভাবক, আপনার সন্তানের {feeHoldReason} (৳{Number(feeHoldAmount || 0).toLocaleString('bn-BD')}) থাকায় সাময়িকভাবে অ্যাকাডেমিক পোর্টাল স্থগিত রয়েছে। অনুগ্রহ করে ফি পরিশোধ করে আইডি সচল করুন।"
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFeeHoldTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmFeeHold()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 flex items-center gap-1.5 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>আইডি স্থগিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER: USER 360 PROFILE (সম্পূর্ণ প্রোফাইল ভিউ) ────────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200/90 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-700" />
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  ইউজার প্রোফাইল ৩৬০
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Profile Card */}
              <div className="text-center flex flex-col items-center">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-2xl shadow-md ring-4 ring-slate-100"
                    style={{
                      backgroundColor:
                        selectedUser.avatarColor || avatarColor(selectedUser.name),
                    }}
                  >
                    {initials(selectedUser.name)}
                  </div>
                  {selectedUser.isOnline && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0 animate-pulse" />
                  )}
                </div>

                <h2 className="text-lg font-black text-slate-900 mt-3 font-heading">
                  {selectedUser.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedUser.designation} · {selectedUser.roleBn}
                </p>

                {/* Status Pill */}
                <div className="mt-2.5">
                  {selectedUser.status === 'fee_hold' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      বকেয়া ফি স্থগিতাদেশ (৳{selectedUser.feeDueAmount.toLocaleString('bn-BD')})
                    </span>
                  ) : selectedUser.status === 'active' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      সক্রিয় অ্যাকাউন্ট
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      নিষ্ক্রিয়
                    </span>
                  )}
                </div>
              </div>

              {/* Online Presence & Device Information */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary-700" />
                  লাইভ উপস্থিতি ও ডিভাইস তথ্য
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">বর্তমান স্ট্যাটাস:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {selectedUser.isOnline ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          অনলাইন এখন
                        </>
                      ) : (
                        selectedUser.lastActiveRelative
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">শেষ পেইজ:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {selectedUser.lastActivePage || 'ড্যাশবোর্ড'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">ডিভাইস ও ব্রাউজার:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-slate-400" />
                      {selectedUser.deviceInfo || 'Chrome / PC'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">আইপি ঠিকানা:</span>
                    <span className="font-mono text-slate-700">
                      {selectedUser.ipAddress || '103.145.22.4'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary-700" />
                  যোগাযোগের বিবরণ
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">মোবাইল নম্বর:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <span>{selectedUser.phone}</span>
                      <button
                        type="button"
                        onClick={() => copyText(selectedUser.phone, 'phone')}
                        className="text-slate-400 hover:text-primary-700"
                      >
                        {copiedId === 'phone' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ইমেইল ঠিকানা:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 truncate max-w-[200px]">
                      <span className="truncate">{selectedUser.email}</span>
                      <button
                        type="button"
                        onClick={() => copyText(selectedUser.email, 'email')}
                        className="text-slate-400 hover:text-primary-700 flex-shrink-0"
                      >
                        {copiedId === 'email' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">শাখা ও ক্যাম্পাস:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedUser.branchName}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Quick Action */}
                <div className="pt-2 border-t border-slate-200/70">
                  <a
                    href={`https://wa.me/${selectedUser.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `আসসালামু আলাইকুম ${selectedUser.name}, আইওএম ইতকান একাডেমি থেকে আপনার অ্যাকাউন্ট সংক্রান্ত তথ্য...`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>হোয়াটসঅ্যাপে মেসেজ পাঠান</span>
                  </a>
                </div>
              </div>

              {/* Fee Hold Reason Notice (If applicable) */}
              {selectedUser.status === 'fee_hold' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    স্থগিতাদেশের বিবরণ
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {selectedUser.feeHoldReason}
                  </p>
                  <div className="text-[11px] text-amber-700 space-y-0.5 pt-1">
                    <p>স্থগিতকারী: {selectedUser.feeHoldBy || 'প্রশাসন সেল'}</p>
                    <p>তারিখ: {selectedUser.feeHoldDate || 'চলতি শিক্ষাবর্ষ'}</p>
                  </div>
                  {canManageUsers && (
                    <button
                      type="button"
                      onClick={() => void handleClearFeeHold(selectedUser)}
                      className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>ফি পরিশোধ সাপেক্ষে আইডি সচল করুন</span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Status Toggle in Drawer */}
              {canManageUsers && selectedUser.status !== 'fee_hold' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      অ্যাকাউন্ট অ্যাক্সেস নিয়ন্ত্রণ
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {selectedUser.status === 'active'
                        ? 'আইডি সাময়িক নিষ্ক্রিয় করতে চান?'
                        : 'আইডি পুনরায় সক্রিয় করতে চান?'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggleStatus(selectedUser)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
                      selectedUser.status === 'active'
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700',
                    )}
                  >
                    {selectedUser.status === 'active' ? 'আইডি বন্ধ করুন' : 'আইডি চালু করুন'}
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD NEW USER ───────────────────────────────────── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-700" />
                <h3 className="font-bold text-base text-slate-900">
                  নতুন ব্যবহারকারী যুক্ত করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const name = (form.elements.namedItem('u_name') as HTMLInputElement).value
                const email = (form.elements.namedItem('u_email') as HTMLInputElement).value
                const phone = (form.elements.namedItem('u_phone') as HTMLInputElement).value
                const uRole = (form.elements.namedItem('u_role') as HTMLSelectElement).value as UserProfileRecord['role']
                const dept = (form.elements.namedItem('u_dept') as HTMLSelectElement).value

                const roleBnMap: Record<string, string> = {
                  central_admin: 'সুপার অ্যাডমিন',
                  branch_admin: 'শাখা পরিচালক',
                  zimmadar: 'বিভাগীয় জিম্মাদার',
                  teacher: 'উস্তাদ',
                  guardian: 'অভিভাবক',
                  student: 'শিক্ষার্থী',
                }

                const newUser: UserProfileRecord = {
                  id: `usr-custom-${Date.now()}`,
                  name,
                  email,
                  phone,
                  role: uRole,
                  roleBn: roleBnMap[uRole] || 'ব্যবহারকারী',
                  designation: `${roleBnMap[uRole]} · ${dept}`,
                  department: dept,
                  branchName: 'ঢাকা মারকায শাখা',
                  status: 'active',
                  feeDueAmount: 0,
                  feeDueMonths: [],
                  isOnline: true,
                  lastActiveAt: new Date().toISOString(),
                  lastActiveRelative: 'অনলাইন এখন',
                  lastActivePage: 'ড্যাশবোর্ড',
                  deviceInfo: 'Chrome / Windows',
                  createdAt: new Date().toISOString(),
                }

                setUsers((prev) => [newUser, ...prev])
                setShowAddUserModal(false)
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পূর্ণ নাম (বাংলা বা ইংরেজি):
                </label>
                <input
                  required
                  name="u_name"
                  type="text"
                  placeholder="যেমন: মাওলানা হাফেজ আব্দুল ওয়াহাব"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর:
                  </label>
                  <input
                    required
                    name="u_phone"
                    type="text"
                    placeholder="+880 1..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইমেইল ঠিকানা:
                  </label>
                  <input
                    required
                    name="u_email"
                    type="email"
                    placeholder="user@iom-itqaan.edu.bd"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ব্যবহারকারীর রোল:
                  </label>
                  <select
                    name="u_role"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none bg-white"
                  >
                    <option value="zimmadar">বিভাগীয় জিম্মাদার (Zimmadar)</option>
                    <option value="teacher">শিক্ষক / উস্তাদ (Teacher)</option>
                    <option value="guardian">অভিভাবক (Guardian)</option>
                    <option value="student">শিক্ষার্থী (Student)</option>
                    <option value="branch_admin">শাখা পরিচালক (Branch Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিভাগ / ডিপার্টমেন্ট:
                  </label>
                  <select
                    name="u_dept"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none bg-white"
                  >
                    <option value="হিফজুল কুরআন বিভাগ">হিফজুল কুরআন বিভাগ</option>
                    <option value="তাজবীদ ও কিরাত বিভাগ">তাজবীদ ও কিরাত বিভাগ</option>
                    <option value="নাজেরা ও নুরানী বিভাগ">নাজেরা ও নুরানী বিভাগ</option>
                    <option value="মহিলা ও শিশু বিভাগ">মহিলা ও শিশু বিভাগ</option>
                    <option value="সাধারণ একাডেমি সেল">সাধারণ একাডেমি সেল</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 rounded-xl shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
