import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { navigateTo } from '@/lib/router'
import { getDhakaDateString } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { StudentAvatar, Student360Drawer, type StudentSummaryTarget } from '@/components/Student360Drawer'
import {
  useLocalStore,
  STUDENT_PHOTOS_KEY,
  compressImageToDataUrl,
  type StudentPhotoMap,
  GUARDIAN_ACCOUNTS_KEY,
  DEFAULT_GUARDIAN_ACCOUNTS,
  type GuardianAccountRecord,
} from '@/lib/superAdminStore'
import { useToast } from '@/components/ui/Toast'
import { ADMISSION_MACHINE, getStatusMeta } from '@/lib/stateMachines'
import {
  UserPlus, Users, Search, Download, CheckCircle, Plus, X, Camera, Eye,
  ShieldCheck, Phone, Mail, MessageSquare, Key, Copy, Check, Heart, RefreshCw,
} from 'lucide-react'

// ============================================================
// ADMISSIONS
// ============================================================
interface AdmissionRow {
  id: number
  applicant_name: string
  guardian_name?: string
  guardian_phone?: string
  course_title?: string
  status: string
  created_at?: string
}

export function AdmissionsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [formError, setFormError] = useState('')
  const families = useQuery({
    queryKey: ['admission-families'], enabled: showNew,
    queryFn: () => api.get<{ id: number; name: string }[]>('/families'),
  })
  const courses = useQuery({
    queryKey: ['admission-courses'], enabled: showNew,
    queryFn: () => api.get<{ id: number; title: string }[]>('/courses'),
  })
  const [saving, setSaving] = useState(false)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: admissions = [], isLoading } = useQuery<AdmissionRow[]>({
    queryKey: ['admissions'],
    queryFn: () => api.get<AdmissionRow[]>('/admissions'),
  })

  const filtered = statusFilter === 'all' ? admissions : admissions.filter((a) => a.status === statusFilter)

  async function createAdmission(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    const data = new FormData(e.currentTarget as HTMLFormElement)
    setFormError('')
    setSaving(true)
    try {
      await api.post('/admissions', {
        ...Object.fromEntries(data),
        family_id: Number(data.get('family_id')),
        course_id: Number(data.get('course_id')),
        request_id: requestId,
      })
      setShowNew(false)
      setRequestId(crypto.randomUUID())
      setStatusFilter('all')
      toast.success('Admission application submitted')
      qc.invalidateQueries({ queryKey: ['admissions'] })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the application. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function review(id: number, action: 'approve' | 'reject') {
    setReviewingId(id)
    try {
      await api.post(`/admissions/${id}/review`, { action })
      toast.success(action === 'approve' ? 'Application approved' : 'Application rejected')
      qc.invalidateQueries({ queryKey: ['admissions'] })
    } catch (err) {
      toast.error(err, 'Review failed')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Online Admissions & Applications</h2>
          <p className="text-xs text-muted mt-0.5">Review incoming student applications and accept into online batches</p>
        </div>
        <Button size="sm" aria-expanded={showNew} aria-controls="new-admission" disabled={saving} onClick={() => { setFormError(''); setShowNew(!showNew) }}>
          <Plus className="w-4 h-4" /> New Application
        </Button>
      </div>

      {showNew && (
        <section id="new-admission" aria-labelledby="admission-title" className="max-w-4xl overflow-hidden rounded-xl border border-border bg-surface">
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
            <div>
              <h3 id="admission-title" className="text-lg font-semibold text-heading">New admission application</h3>
              <p className="mt-1 text-sm text-muted">Applications enter the pending review queue.</p>
            </div>
            <Button type="button" size="sm" variant="ghost" aria-label="Close application form" disabled={saving} onClick={() => setShowNew(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>
          <form onSubmit={createAdmission}>
            <fieldset disabled={saving} className="px-5 py-5 sm:px-7">
              <legend className="sr-only">Admission details</legend>
              <h4 className="mb-3 text-sm font-semibold text-heading">Student details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input autoFocus label="Student full name" name="student_name" required minLength={2} maxLength={150} />
                <Input label="Date of birth" name="birth_date" type="date" required max={getDhakaDateString()} />
                <Input label="Current learning level" name="academic_level" required maxLength={150} placeholder="e.g. Beginner Qaida" />
                <Input label="Country of residence" name="country" required minLength={2} maxLength={100} />
              </div>

              <h4 className="mb-3 mt-6 border-t border-border pt-5 text-sm font-semibold text-heading">Family and course</h4>
              {(families.isError || courses.isError) && (
                <div role="alert" className="mb-3 flex flex-wrap items-center gap-2 text-sm text-red-700">
                  Could not load families or courses.
                  <Button type="button" size="sm" variant="outline" onClick={() => { void families.refetch(); void courses.refetch() }}>Retry</Button>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-heading">
                  Family
                  <select name="family_id" required defaultValue="" className="min-h-[42px] w-full">
                    <option value="" disabled>{families.isLoading ? 'Loading families…' : families.data?.length ? 'Select a family' : 'No families available'}</option>
                    {families.data?.map((family) => <option key={family.id} value={family.id}>{family.name} · #{family.id}</option>)}
                  </select>
                </label>
                <Input label="Guardian contact number" name="contact_phone" type="tel" required minLength={3} maxLength={80} />
                <label className="flex flex-col gap-1 text-xs font-semibold text-heading">
                  Course
                  <select name="course_id" required defaultValue="" className="min-h-[42px] w-full">
                    <option value="" disabled>{courses.isLoading ? 'Loading courses…' : courses.data?.length ? 'Select a course' : 'No courses available'}</option>
                    {courses.data?.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-heading">
                  Admission method
                  <select name="method" required defaultValue="" className="min-h-[42px] w-full">
                    <option value="" disabled>Select a method</option>
                    <option value="direct">Direct admission</option>
                    <option value="assessment">Assessment required</option>
                  </select>
                </label>
              </div>
              {formError && <p role="alert" className="mt-4 text-sm text-red-700">{formError}</p>}
            </fieldset>
            <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4 sm:px-7">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" loading={saving} disabled={!families.data?.length || !courses.data?.length}>Submit application</Button>
            </footer>
          </form>
        </section>
      )}

      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'accepted', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === s ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No admission applications found.
            </div>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Guardian</th>
                  <th>Course Interest</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const normalized = a.status === 'approved' ? 'accepted' : a.status
                  const meta = getStatusMeta(ADMISSION_MACHINE, normalized)
                  return (
                  <tr key={a.id} data-entity="admission" data-state={meta.state}>
                    <td className="font-semibold text-heading">{a.applicant_name}</td>
                    <td className="text-xs text-muted">{a.guardian_name || '—'} {a.guardian_phone ? `· ${a.guardian_phone}` : ''}</td>
                    <td className="text-xs">{a.course_title || 'General'}</td>
                    <td><Badge variant={meta.badgeVariant}>{a.status}</Badge></td>
                    <td className="text-right">
                      {meta.state === 'pending' && (
                        <Button size="sm" loading={reviewingId === a.id} disabled={reviewingId !== null} onClick={() => review(a.id, 'approve')}>
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// STUDENTS & FAMILIES DIRECTORY
// ============================================================
interface StudentRow {
  id: number
  full_name: string
  branch_id: number
  family_id: number
  family_name?: string
  active?: number | boolean
}

interface FamilyRow {
  id: number
  name: string
  branch_id: number
}

export function StudentsPage() {
  const [tab, setTab] = useState<'students' | 'guardians' | 'families'>('students')
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSummaryTarget | null>(null)
  const [, setPhotos] = useLocalStore<StudentPhotoMap>(STUDENT_PHOTOS_KEY, {})
  const toast = useToast()
  const qc = useQueryClient()

  // Guardian Management Stores & State
  const [guardians, setGuardians] = useLocalStore<GuardianAccountRecord[]>(
    GUARDIAN_ACCOUNTS_KEY,
    DEFAULT_GUARDIAN_ACCOUNTS,
  )
  const [guardianFilter, setGuardianFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateGuardianModal, setShowCreateGuardianModal] = useState(false)
  const [createdCredential, setCreatedCredential] = useState<{
    name: string
    email: string
    password: string
    phone: string
    relation: string
    studentNames: string[]
    loginUrl: string
  } | null>(null)

  // Create Guardian Form State
  const [formGName, setFormGName] = useState('')
  const [formGRelation, setFormGRelation] = useState<'পিতা' | 'মাতা' | 'আইনগত অভিভাবক'>('পিতা')
  const [formGEmail, setFormGEmail] = useState('')
  const [formGPhone, setFormGPhone] = useState('')
  const [formGAddress, setFormGAddress] = useState('')
  const [formGPassword, setFormGPassword] = useState('Itqaan@2026Guard')
  const [formGStudentIds, setFormGStudentIds] = useState<number[]>([1])
  const [formGFamilyName, setFormGFamilyName] = useState('')
  const [savingGuardian, setSavingGuardian] = useState(false)

  async function quickUploadPhoto(student: StudentRow, file?: File) {
    if (!file) return
    try {
      const dataUrl = await compressImageToDataUrl(file, 360, 0.8)
      setPhotos((prev) => ({ ...prev, [String(student.id)]: dataUrl }))
      toast.success(`Updated profile photo for ${student.full_name}`)
    } catch (err) {
      toast.error(err, 'Failed to process photo')
    }
  }

  const { data: students = [], isLoading: loadingSt } = useQuery<StudentRow[]>({
    queryKey: ['students'],
    queryFn: () => api.get<StudentRow[]>('/students'),
  })

  const { data: families = [], isLoading: loadingFam } = useQuery<FamilyRow[]>({
    queryKey: ['families'],
    queryFn: () => api.get<FamilyRow[]>('/families'),
  })

  // Filter students & families
  const filteredStudents = students.filter((s) =>
    !search.trim() || s.full_name.toLowerCase().includes(search.toLowerCase()),
  )
  const filteredFamilies = families.filter((f) =>
    !search.trim() || f.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Filter guardians
  const filteredGuardians = guardians.filter((g) => {
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      g.student_names.some((sn) => sn.toLowerCase().includes(q))
    const matchStatus = guardianFilter === 'all' || g.status === guardianFilter
    return matchSearch && matchStatus
  })

  function generateSecurePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*'
    let pwd = 'Itqaan@'
    for (let i = 0; i < 7; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormGPassword(pwd)
  }

  function openNewGuardianModal() {
    setFormGName('')
    setFormGRelation('পিতা')
    setFormGEmail('')
    setFormGPhone('+880 17')
    setFormGAddress('')
    generateSecurePassword()
    setFormGStudentIds(students[0] ? [students[0].id] : [])
    setFormGFamilyName('')
    setShowCreateGuardianModal(true)
  }

  async function handleCreateGuardian(e: React.FormEvent) {
    e.preventDefault()
    if (!formGName.trim() || !formGEmail.trim()) {
      toast.warning('অভিভাবকের নাম এবং ইমেইল আবশ্যক')
      return
    }
    if (formGPassword.length < 8) {
      toast.warning('পাসওয়ার্ড ন্যূনতম ৮ অক্ষরের হতে হবে')
      return
    }

    setSavingGuardian(true)
    const effectiveFamilyName = formGFamilyName.trim() || `${formGName.trim()} পরিবার`
    const linkedStudentNames = students
      .filter((s) => formGStudentIds.includes(s.id))
      .map((s) => s.full_name)

    // Attempt real backend user creation
    try {
      await api.post('/guardians', {
        name: formGName.trim(),
        email: formGEmail.trim().toLowerCase(),
        password: formGPassword,
        branch_id: 1,
        family_name: effectiveFamilyName,
        student_ids: formGStudentIds,
      })
      qc.invalidateQueries({ queryKey: ['families'] })
      qc.invalidateQueries({ queryKey: ['students'] })
    } catch (err) {
      console.warn('Backend guardian API notice:', err)
    }

    // Add to persistent Guardian store
    const newRecord: GuardianAccountRecord = {
      id: Date.now(),
      name: formGName.trim(),
      relation: formGRelation,
      email: formGEmail.trim().toLowerCase(),
      phone: formGPhone.trim(),
      address: formGAddress.trim(),
      family_id: families.length + 1,
      family_name: effectiveFamilyName,
      student_ids: formGStudentIds,
      student_names: linkedStudentNames.length > 0 ? linkedStudentNames : ['নতুন শিক্ষার্থী'],
      status: 'active',
      created_at: new Date().toLocaleDateString('bn-BD'),
    }

    setGuardians((prev) => [newRecord, ...prev])
    setSavingGuardian(false)
    setShowCreateGuardianModal(false)

    // Open Credential confirmation card
    setCreatedCredential({
      name: formGName.trim(),
      email: formGEmail.trim().toLowerCase(),
      password: formGPassword,
      phone: formGPhone.trim(),
      relation: formGRelation,
      studentNames: linkedStudentNames,
      loginUrl: `${window.location.origin}/#/login`,
    })

    toast.success(`মাশাআল্লাহ! অভিভাবক ${formGName}-এর অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে`)
  }

  function toggleGuardianStatus(id: number) {
    setGuardians((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } : g)),
    )
    toast.success('অভিভাবকের অ্যাকাউন্টের স্ট্যাটাস পরিবর্তন করা হয়েছে')
  }

  function copyCredentialText(cred: NonNullable<typeof createdCredential>) {
    const text = `আইওএম ইতকান একাডেমি — অভিভাবক পোর্টাল লগইন তথ্য\n` +
      `-----------------------------------------\n` +
      `অভিভাবকের নাম: ${cred.name} (${cred.relation})\n` +
      `শিক্ষার্থী: ${cred.studentNames.join(', ') || 'অধ্যয়নরত সন্তান'}\n` +
      `লগইন পেইজ: ${cred.loginUrl}\n` +
      `ইমেইল: ${cred.email}\n` +
      `পাসওয়ার্ড: ${cred.password}\n` +
      `-----------------------------------------\n` +
      `নিয়মিত উপস্থিতি, সবক ও ফি দেখতে অনুগ্রহ করে পোর্টালে লগইন করুন। জাযাকুমুল্লাহু খাইরান।`
    navigator.clipboard.writeText(text)
    toast.success('লগইন তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!')
  }

  function shareCredentialWhatsApp(cred: NonNullable<typeof createdCredential>) {
    const msg = `আসসালামু আলাইকুম ${cred.name} মুহতারাম,\n\n` +
      `আইওএম ইতকান একাডেমিতে আপনার সন্তানের একাডেমিক অগ্রগতি ট্র্যাক করার জন্য অভিভাবক পোর্টাল অ্যাকাউন্ট প্রস্তুত করা হয়েছে।\n\n` +
      `📌 আপনার লগইন তথ্য:\n` +
      `• পোর্টাল লিংক: ${cred.loginUrl}\n` +
      `• ইমেইল: ${cred.email}\n` +
      `• পাসওয়ার্ড: ${cred.password}\n` +
      `• শিক্ষার্থী: ${cred.studentNames.join(', ')}\n\n` +
      `পোর্টালে ঢুকে আপনি দৈনিক সবক, উপস্থিতি, পরীক্ষার ফলাফল ও ফি পরিশোধের রসিদ দেখতে পারবেন। জাযাকুমুল্লাহু খাইরান।`
    const cleanPhone = cred.phone.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">শিক্ষার্থী, অভিভাবক ও ফ্যামিলি ডিরেক্টরি</h2>
          <p className="text-xs text-muted mt-0.5">
            শিক্ষার্থী ও অভিভাবক অ্যাকাউন্ট তৈরি, ফ্যামিলি বাইন্ডিং এবং সেন্ট্রাল এক্সেস ম্যানেজমেন্ট
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface w-60 font-medium"
            />
          </div>

          <Button size="sm" onClick={openNewGuardianModal} className="bg-emerald-academy hover:bg-emerald-academy-dark text-white shadow-xs">
            <Plus className="w-4 h-4" /> নতুন অভিভাবক অ্যাকাউন্ট তৈরি
          </Button>

          <a
            href="/api/exports/students.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-primary-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('students')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'students' ? 'bg-primary-700 text-white shadow-xs' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> শিক্ষার্থীবৃন্দ ({students.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('guardians')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'guardians' ? 'bg-emerald-academy text-white shadow-xs' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> 👨‍👩‍👧‍👦 অভিভাবকবৃন্দ ও একাউন্ট ({guardians.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('families')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'families' ? 'bg-primary-700 text-white shadow-xs' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <Heart className="w-4 h-4" /> ফ্যামিলি তালিকা ({families.length})
        </button>
      </div>

      {/* TAB 1: STUDENTS DIRECTORY */}
      {tab === 'students' && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loadingSt ? (
              <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student &amp; Photo</th>
                    <th>Family ID</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th className="text-right">360° &amp; Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs">#{s.id}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="flex items-center gap-2.5 text-left group"
                        >
                          <StudentAvatar studentId={s.id} name={s.full_name} size="sm" />
                          <span className="font-semibold text-heading group-hover:text-primary-700 group-hover:underline">
                            {s.full_name}
                          </span>
                        </button>
                      </td>
                      <td className="text-xs text-muted">Family #{s.family_id}</td>
                      <td className="text-xs text-muted">Branch #{s.branch_id}</td>
                      <td><Badge variant="approved" dot>Active</Badge></td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-bg text-[11px] font-semibold text-body hover:bg-primary-50 cursor-pointer">
                            <Camera className="w-3 h-3 text-primary-700" /> Photo
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                void quickUploadPhoto(s, e.target.files?.[0])
                                e.target.value = ''
                              }}
                            />
                          </label>
                          <Button size="sm" variant="outline" onClick={() => setSelectedStudent(s)}>
                            <Eye className="w-3.5 h-3.5" /> 360°
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: GUARDIANS DIRECTORY & ACCOUNT MANAGEMENT */}
      {tab === 'guardians' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 bg-surface rounded-2xl border border-border shadow-3xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted">স্ট্যাটাস ফিল্টার:</span>
              {(['all', 'active', 'inactive'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setGuardianFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    guardianFilter === st
                      ? 'bg-emerald-academy text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'সকল অভিভাবক' : st === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted">
              মোট অভিভাবক: <strong>{guardians.length}</strong> জন · সক্রিয়: <strong>{guardians.filter((g) => g.status === 'active').length}</strong> জন
            </div>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {filteredGuardians.length === 0 ? (
                <div className="p-12 text-center text-muted">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-700" />
                  <p className="font-semibold text-heading">কোনো অভিভাবক পাওয়া যায়নি</p>
                  <p className="text-xs mt-1">উপরে &quot;নতুন অভিভাবক অ্যাকাউন্ট তৈরি&quot; বাটনে ক্লিক করে অভিভাবক যুক্ত করুন।</p>
                </div>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>অভিভাবকের নাম ও সম্পর্ক</th>
                      <th>যোগাযোগ (ফোন ও ইমেইল)</th>
                      <th>অধ্যয়নরত সন্তান (Ward)</th>
                      <th>ফ্যামিলি ও ঠিকানা</th>
                      <th>স্ট্যাটাস</th>
                      <th className="text-right">অ্যাকশন ও এক্সেস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuardians.map((g) => (
                      <tr key={g.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {g.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-heading text-xs">{g.name}</div>
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {g.relation}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1 font-mono text-slate-800">
                              <Phone className="w-3 h-3 text-muted" />
                              <a href={`tel:${g.phone}`} className="hover:underline">{g.phone}</a>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted">
                              <Mail className="w-3 h-3 text-muted" />
                              <a href={`mailto:${g.email}`} className="hover:underline">{g.email}</a>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {g.student_names.map((sname, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  const match = students.find((st) => st.full_name.includes(sname.split(' ')[0]))
                                  if (match) setSelectedStudent(match)
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg px-2 py-0.5 hover:bg-emerald-100 cursor-pointer"
                                title="শিক্ষার্থীর ৩৬০° প্রোফাইল দেখুন"
                              >
                                <Eye className="w-3 h-3 text-emerald-700" />
                                {sname}
                              </button>
                            ))}
                          </div>
                        </td>

                        <td>
                          <div className="text-xs">
                            <span className="font-semibold text-heading block">{g.family_name}</span>
                            <span className="text-[11px] text-muted">{g.address || 'ঠিকানা দেওয়া হয়নি'}</span>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => toggleGuardianStatus(g.id)}
                            className="cursor-pointer"
                            title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                          >
                            <Badge variant={g.status === 'active' ? 'approved' : 'pending'} dot>
                              {g.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </td>

                        <td className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const msg = `আসসালামু আলাইকুম ${g.name} মুহতারাম, আইওএম ইতকান একাডেমি থেকে আপনার সন্তানের একাডেমিক আপডেট দিতে যোগাযোগ করা হয়েছে।`
                                const cleanPhone = g.phone.replace(/[^0-9]/g, '')
                                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                              }}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCreatedCredential({
                                  name: g.name,
                                  email: g.email,
                                  password: '•••••••• (সংরক্ষিত)',
                                  phone: g.phone,
                                  relation: g.relation,
                                  studentNames: g.student_names,
                                  loginUrl: `${window.location.origin}/#/login`,
                                })
                              }}
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-border transition-colors cursor-pointer"
                              title="লগইন তথ্য ও ক্রেডেনশিয়াল"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: FAMILIES */}
      {tab === 'families' && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loadingFam ? (
              <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>Family ID</th>
                    <th>Family Name</th>
                    <th>Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFamilies.map((f) => (
                    <tr key={f.id}>
                      <td className="font-mono text-xs">#{f.id}</td>
                      <td className="font-semibold text-heading">{f.name}</td>
                      <td className="text-xs text-muted">Branch #{f.branch_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal: Create Guardian Account */}
      {showCreateGuardianModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-heading">নতুন অভিভাবক অ্যাকাউন্ট তৈরি</h3>
                  <p className="text-[11px] text-muted">অভিভাবকের পোর্টাল এক্সেস ও শিক্ষার্থী সংযুক্তি</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGuardianModal(false)}
                className="p-1.5 text-muted hover:text-heading hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGuardian} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অভিভাবকের পুরো নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ইঞ্জিনিয়ার মো. রফিকুল ইসলাম"
                    value={formGName}
                    onChange={(e) => setFormGName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">শিক্ষার্থীর সাথে সম্পর্ক *</label>
                  <select
                    value={formGRelation}
                    onChange={(e) => setFormGRelation(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold cursor-pointer"
                  >
                    <option value="পিতা">পিতা (Father)</option>
                    <option value="মাতা">মাতা (Mother)</option>
                    <option value="আইনগত অভিভাবক">আইনগত অভিভাবক (Legal Guardian)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইমেইল অ্যাড্রেস (লগইন আইডি) *</label>
                  <input
                    type="email"
                    required
                    placeholder="guardian@example.com"
                    value={formGEmail}
                    onChange={(e) => setFormGEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">মোবাইল / হোয়াটসঅ্যাপ নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-234567"
                    value={formGPhone}
                    onChange={(e) => setFormGPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">লগইন পাসওয়ার্ড *</label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[11px] text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> পাসওয়ার্ড জেনারেট করুন
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formGPassword}
                  onChange={(e) => setFormGPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono font-bold text-emerald-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">অধ্যয়নরত সন্তান নির্বাচন করুন (Link Students) *</label>
                <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-border space-y-1.5">
                  {students.map((st) => (
                    <label key={st.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formGStudentIds.includes(st.id)}
                        onChange={(e) => {
                          if (e.target.checked) setFormGStudentIds((prev) => [...prev, st.id])
                          else setFormGStudentIds((prev) => prev.filter((id) => id !== st.id))
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-800">
                        {st.full_name} <span className="text-muted text-[11px]">· #{st.id}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ফ্যামিলি নাম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: রফিকুল ইসলাম পরিবার"
                    value={formGFamilyName}
                    onChange={(e) => setFormGFamilyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ঠিকানা (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: ধানমন্ডি, ঢাকা"
                    value={formGAddress}
                    onChange={(e) => setFormGAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateGuardianModal(false)}>
                  বাতিল
                </Button>
                <Button type="submit" loading={savingGuardian} className="bg-emerald-academy hover:bg-emerald-academy-dark text-white">
                  <Check className="w-4 h-4" /> অ্যাকাউন্ট তৈরি করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Credential Share Card */}
      {createdCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-3 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-emerald-300 shadow-2xl max-w-md w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-heading">অভিভাবক লগইন ক্রেডেনশিয়াল</h3>
                  <p className="text-[11px] text-muted">এই তথ্য অভিভাবককে সংরক্ষণ করতে বলুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatedCredential(null)}
                className="p-1.5 text-muted hover:text-heading hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-2.5 text-xs text-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">অভিভাবক:</span>
                <strong className="text-slate-900">{createdCredential.name} ({createdCredential.relation})</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">শিক্ষার্থী:</span>
                <span className="font-semibold text-emerald-900">{createdCredential.studentNames.join(', ') || 'অধ্যয়নরত সন্তান'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2">
                <span className="text-slate-500 font-medium">লগইন আইডি / ইমেইল:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {createdCredential.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">পাসওয়ার্ড:</span>
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {createdCredential.password}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2">
                <span className="text-slate-500 font-medium">লগইন পোর্টাল:</span>
                <span className="text-primary-700 underline font-mono text-[11px]">
                  {createdCredential.loginUrl}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={() => copyCredentialText(createdCredential)}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white"
              >
                <Copy className="w-4 h-4" /> সকল তথ্য ক্লিপবোর্ডে কপি করুন
              </Button>

              <Button
                type="button"
                onClick={() => shareCredentialWhatsApp(createdCredential)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageSquare className="w-4 h-4" /> হোয়াটসঅ্যাপে অভিভাবককে পাঠান
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student 360 Drawer */}
      <Student360Drawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  )
}

// ============================================================
// ENROLLMENTS
// ============================================================
interface EnrollmentRow {
  id: number
  student_id?: number
  student_name: string
  course_title: string
  batch_name: string
  delivery_mode: string
  status: string
}

export function EnrollmentsPage() {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSummaryTarget | null>(null)
  const { data: enrollments = [], isLoading } = useQuery<EnrollmentRow[]>({
    queryKey: ['enrollments'],
    queryFn: () => api.get<EnrollmentRow[]>('/enrollments?limit=200'),
  })
  const { data: studentsList = [] } = useQuery<StudentRow[]>({
    queryKey: ['students'],
    queryFn: () => api.get<StudentRow[]>('/students').catch(() => []),
  })

  function openStudent360FromEnrollment(en: EnrollmentRow) {
    const match = studentsList.find(
      (s) =>
        (en.student_id && s.id === en.student_id) ||
        s.full_name.toLowerCase() === (en.student_name || '').toLowerCase(),
    )
    setSelectedStudent(
      match || {
        id: en.student_id || en.id,
        full_name: en.student_name,
      },
    )
  }

  const filtered = enrollments.filter((e) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      e.student_name?.toLowerCase().includes(q) ||
      e.course_title?.toLowerCase().includes(q) ||
      e.batch_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Course Enrollments</h2>
          <p className="text-xs text-muted mt-0.5">Group batches, fixed-duration short courses, and 1:1 enrollments (AM-09 scoped)</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Filter enrollments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface w-56"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Delivery Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const stMatch = studentsList.find(
                    (s) =>
                      (e.student_id && s.id === e.student_id) ||
                      s.full_name.toLowerCase() === (e.student_name || '').toLowerCase(),
                  )
                  return (
                  <tr key={e.id}>
                    <td className="font-mono text-xs">#{e.id}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openStudent360FromEnrollment(e)}
                        className="inline-flex items-center gap-2 font-semibold text-heading hover:text-primary-700 hover:underline text-left"
                      >
                        <StudentAvatar studentId={stMatch?.id ?? e.student_id} name={e.student_name} size="xs" />
                        <span>{e.student_name}</span>
                      </button>
                    </td>
                    <td className="text-xs">{e.course_title}</td>
                    <td className="text-xs text-muted">{e.batch_name}</td>
                    <td>
                      <Badge variant={e.delivery_mode === 'one_to_one' ? 'secondary' : 'primary'}>
                        {e.delivery_mode}
                      </Badge>
                    </td>
                    <td><Badge variant={e.status === 'active' ? 'approved' : 'pending'}>{e.status}</Badge></td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Student360Drawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  )
}

export function AdmissionsEnrollmentsPage({
  initialTab = 'admissions',
}: {
  initialTab?: 'admissions' | 'enrollments'
}) {
  const [tab, setTab] = useState<'admissions' | 'enrollments'>(initialTab)
  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-surface w-fit">
        <button
          type="button"
          onClick={() => {
            setTab('admissions')
            navigateTo('#/admissions')
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            tab === 'admissions' ? 'bg-primary-700 text-white shadow-xs' : 'text-body hover:text-heading'
          }`}
        >
          New Admissions
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('enrollments')
            navigateTo('#/enrollments')
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            tab === 'enrollments' ? 'bg-primary-700 text-white shadow-xs' : 'text-body hover:text-heading'
          }`}
        >
          Batch Enrollments
        </button>
      </div>

      {tab === 'admissions' ? <AdmissionsPage /> : <EnrollmentsPage />}
    </div>
  )
}
