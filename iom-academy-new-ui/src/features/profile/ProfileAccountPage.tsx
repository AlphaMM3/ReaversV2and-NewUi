import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import type { CurrentUser } from '@/lib/api'
import { api, toArray } from '@/lib/api'
import {
  useLocalStore,
  TEACHER_LEAVES_KEY,
  type TeacherLeaveRecord,
} from '@/lib/superAdminStore'
import {
  User, KeyRound, CalendarOff, Receipt, ShieldCheck,
  CheckCircle2, Plus, AlertCircle,
} from 'lucide-react'

interface Props {
  user: CurrentUser
  role: string
}

interface PayableRecord {
  id: number
  billing_month: string
  payable_amount: number | string
  status: string
  course_title?: string
  batch_name?: string
  due_date?: string
}

export default function ProfileAccountPage({ user, role }: Props) {
  const toast = useToast()
  const isTeacher = role === 'teacher'

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPass, setChangingPass] = useState(false)
  const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Teacher Leaves from SuperAdmin Store
  const [teacherLeaves, setTeacherLeaves] = useLocalStore<TeacherLeaveRecord[]>(TEACHER_LEAVES_KEY, [])
  const myLeaves = teacherLeaves.filter((l) => l.teacher_id === user.id || l.teacher_name === user.name)

  // Leave application form
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveEnd, setLeaveEnd] = useState('')
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveProxy, setLeaveProxy] = useState('')
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  // Teacher Payables from API
  const { data: payablesRaw = [] } = useQuery<PayableRecord[]>({
    queryKey: ['my-payroll', user.id],
    queryFn: () =>
      api.get<PayableRecord[] | { items?: PayableRecord[] }>('/teacher/payables')
        .then(toArray)
        .catch(() => [] as PayableRecord[]),
    enabled: isTeacher,
  })
  const myPayables = toArray(payablesRaw)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassMessage(null)

    if (!currentPassword) {
      setPassMessage({ type: 'error', text: 'Please enter your current password' })
      return
    }
    if (newPassword.length < 6) {
      setPassMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: 'error', text: 'New password and confirm password do not match' })
      return
    }

    setChangingPass(true)
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPassMessage({ type: 'success', text: 'Password changed successfully!' })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const msg = err?.message || 'Failed to change password. Please check your current password.'
      setPassMessage({ type: 'error', text: msg })
      toast.error(msg)
    } finally {
      setChangingPass(false)
    }
  }

  function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault()
    if (!leaveStart || !leaveEnd || !leaveReason.trim()) {
      toast.error('Please fill in start date, end date, and reason')
      return
    }

    setSubmittingLeave(true)
    const newRecord: TeacherLeaveRecord = {
      id: `TL-${Date.now()}`,
      teacher_id: user.id,
      teacher_name: user.name,
      start_date: leaveStart,
      end_date: leaveEnd,
      reason: leaveReason.trim(),
      status: 'pending',
      substitute_teacher_name: leaveProxy.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    setTeacherLeaves((prev) => [newRecord, ...prev])
    setSubmittingLeave(false)
    setShowLeaveModal(false)
    setLeaveStart('')
    setLeaveEnd('')
    setLeaveReason('')
    setLeaveProxy('')
    toast.success('Leave application submitted to Zimmadar')
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading flex items-center gap-2.5">
            <User className="w-6 h-6 text-primary-700" /> My Account &amp; Profile
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your credentials, password, leave applications, and view your monthly compensation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="capitalize text-xs font-semibold px-2.5 py-1">
            Role: {role.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="approved" className="text-xs font-semibold px-2.5 py-1">
            Account Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Change Password */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-700" /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-700 text-white font-bold text-base flex items-center justify-center shadow-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-heading truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted">User ID:</span>
                  <span className="font-semibold text-heading">#{user.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Branch:</span>
                  <span className="font-semibold text-heading">Main Online Branch (BD)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Access Level:</span>
                  <span className="font-semibold text-primary-700 capitalize">{role.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Form */}
          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary-700" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                {passMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      passMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {passMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{passMessage.text}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-heading mb-1">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-heading mb-1">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-heading mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="w-full mt-2"
                  disabled={changingPass}
                >
                  {changingPass ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Leaves & Payroll */}
        <div className="lg:col-span-2 space-y-6">
          {/* Teacher Leaves Card */}
          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarOff className="w-4 h-4 text-primary-700" /> My Leave Requests
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  Submit absence / proxy requests directly to Zimmadar supervision.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowLeaveModal(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Apply for Leave
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {myLeaves.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted bg-bg/50 rounded-xl border border-dashed border-border">
                  No leave requests submitted yet. You have full attendance on record.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {myLeaves.map((leave) => (
                    <div key={leave.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-heading">
                            {leave.start_date} to {leave.end_date}
                          </span>
                          <Badge
                            variant={
                              leave.status === 'approved'
                                ? 'approved'
                                : leave.status === 'rejected'
                                  ? 'cancelled'
                                  : 'pending'
                            }
                            className="capitalize text-[10px]"
                          >
                            {leave.status}
                          </Badge>
                        </div>
                        <p className="text-muted mt-0.5">{leave.reason}</p>
                        {leave.substitute_teacher_name && (
                          <p className="text-primary-700 text-[11px] mt-0.5">
                            Proxy Assigned: {leave.substitute_teacher_name}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted flex-shrink-0">
                        {leave.created_at?.slice(0, 10)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher Payroll / Honorarium Card */}
          {isTeacher && (
            <Card className="rounded-2xl shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-700" /> My Monthly Payroll &amp; Honorarium
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  Monthly compensation slips calculated from held class count and 1:1 sessions.
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                {myPayables.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted bg-bg/50 rounded-xl border border-dashed border-border">
                    <p className="font-semibold text-heading">No pending or historical payroll slips found</p>
                    <p className="mt-1">
                      Monthly statements generate automatically at the end of each billing cycle upon Zimmadar verification.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {myPayables.map((pay) => (
                      <div key={pay.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-heading">Billing Month: {pay.billing_month}</p>
                          <p className="text-muted">
                            {pay.course_title || 'General Teaching Honorarium'} · {pay.batch_name || 'Standard Rate'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-heading">৳ {Number(pay.payable_amount).toLocaleString()}</p>
                          <Badge
                            variant={pay.status === 'paid' ? 'approved' : 'pending'}
                            className="capitalize text-[10px] mt-0.5"
                          >
                            {pay.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-heading flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-primary-700" /> Apply for Absence / Leave
              </h3>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="text-muted hover:text-heading cursor-pointer text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-heading mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-heading mb-1">End Date</label>
                  <Input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-heading mb-1">Reason for Leave</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="State the reason (medical, family, urgent work, etc.)"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs text-heading focus:outline-none focus:ring-2 focus:ring-primary-700"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-heading mb-1">Suggested Proxy Teacher (Optional)</label>
                <Input
                  type="text"
                  value={leaveProxy}
                  onChange={(e) => setLeaveProxy(e.target.value)}
                  placeholder="e.g. Maulana Abdullah"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeaveModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingLeave}>
                  {submittingLeave ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
