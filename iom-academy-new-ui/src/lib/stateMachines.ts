// ============================================================
// Explicit Domain & UI State Machine Registry (UX · DX · AX)
// Single source of truth for allowed states, transitions,
// badge variants, UI actions, and inspectable machine specs.
// ============================================================

export type AuthStatus = 'checking' | 'unauthenticated' | 'authenticated'
export type ClassStatus = 'scheduled' | 'in_progress' | 'ended' | 'cancelled'
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'returned'
export type AttendanceStatus = 'Unrecorded' | 'Present' | 'Late' | 'Absent'
export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type AdmissionStatus = 'pending' | 'accepted' | 'rejected'
export type FollowupStatus = 'open' | 'closed'
export type PayableStatus = 'pending' | 'paid'
export type ContractStatus = 'active' | 'ended' | 'paused'

export type SemanticBadgeVariant =
  | 'primary'
  | 'secondary'
  | 'scheduled'
  | 'in_progress'
  | 'ended'
  | 'cancelled'
  | 'approved'
  | 'pending'
  | 'present'
  | 'absent'
  | 'late'

export interface StateMeta<S extends string> {
  state: S
  label: string
  badgeVariant: SemanticBadgeVariant
  next: readonly S[]
  description: string
}

export interface StateMachineSpec<S extends string> {
  id: string
  entity: string
  initial: S
  states: Record<S, StateMeta<S>>
}

// ── 1. Auth Session Machine ─────────────────────────────────
export const AUTH_MACHINE: StateMachineSpec<AuthStatus> = {
  id: 'auth_session',
  entity: 'UserSession',
  initial: 'checking',
  states: {
    checking: {
      state: 'checking',
      label: 'Checking Session',
      badgeVariant: 'pending',
      next: ['authenticated', 'unauthenticated'],
      description: 'Bootstrapping /api/me session and CSRF token',
    },
    unauthenticated: {
      state: 'unauthenticated',
      label: 'Signed Out',
      badgeVariant: 'ended',
      next: ['authenticated'],
      description: 'No active cookie/CSRF session; LoginView rendered',
    },
    authenticated: {
      state: 'authenticated',
      label: 'Signed In',
      badgeVariant: 'approved',
      next: ['unauthenticated', 'authenticated'],
      description: 'Active session with verified user, role, and CSRF token',
    },
  },
}

// ── 2. Class Session Operational Lifecycle ──────────────────
export const CLASS_SESSION_MACHINE: StateMachineSpec<ClassStatus> = {
  id: 'class_session',
  entity: 'ClassSession',
  initial: 'scheduled',
  states: {
    scheduled: {
      state: 'scheduled',
      label: 'Scheduled',
      badgeVariant: 'scheduled',
      next: ['in_progress', 'cancelled'],
      description: 'Planned online session awaiting start (meeting link can be opened)',
    },
    in_progress: {
      state: 'in_progress',
      label: 'Live',
      badgeVariant: 'in_progress',
      next: ['ended', 'cancelled'],
      description: 'Session actively running; teacher can end class',
    },
    ended: {
      state: 'ended',
      label: 'Ended',
      badgeVariant: 'ended',
      next: [],
      description: 'Session ended; verify held -> unlock attendance -> submit report',
    },
    cancelled: {
      state: 'cancelled',
      label: 'Cancelled',
      badgeVariant: 'cancelled',
      next: [],
      description: 'Terminal cancelled class state',
    },
  },
}

export interface ClassActionCapability {
  status: ClassStatus
  label: string
  badgeVariant: SemanticBadgeVariant
  isLive: boolean
  isHeldVerified: boolean
  canStart: boolean
  canEnd: boolean
  canVerifyHeld: boolean
  canMarkAttendance: boolean
  canOpenReport: boolean
  nextPrimaryAction: 'start' | 'end' | 'verify_held' | 'attendance' | 'none'
}

export function deriveClassCapabilities(cls: {
  status: string
  held_verified?: number | boolean | null
}): ClassActionCapability {
  const status = (
    cls.status in CLASS_SESSION_MACHINE.states ? cls.status : 'scheduled'
  ) as ClassStatus
  const meta = CLASS_SESSION_MACHINE.states[status]
  const isHeldVerified = Boolean(cls.held_verified)
  const canStart = status === 'scheduled'
  const canEnd = status === 'in_progress'
  const canVerifyHeld = status === 'ended' && !isHeldVerified
  const canMarkAttendance = status === 'ended' && isHeldVerified
  const canOpenReport = status === 'ended'

  let nextPrimaryAction: ClassActionCapability['nextPrimaryAction'] = 'none'
  if (canStart) nextPrimaryAction = 'start'
  else if (canEnd) nextPrimaryAction = 'end'
  else if (canVerifyHeld) nextPrimaryAction = 'verify_held'
  else if (canMarkAttendance) nextPrimaryAction = 'attendance'

  return {
    status,
    label: meta.label,
    badgeVariant: meta.badgeVariant,
    isLive: status === 'in_progress',
    isHeldVerified,
    canStart,
    canEnd,
    canVerifyHeld,
    canMarkAttendance,
    canOpenReport,
    nextPrimaryAction,
  }
}

// ── 3. Class Report Concurrency & Review Machine ────────────
export const REPORT_MACHINE: StateMachineSpec<ReportStatus> = {
  id: 'class_report',
  entity: 'ClassReport',
  initial: 'draft',
  states: {
    draft: {
      state: 'draft',
      label: 'Draft',
      badgeVariant: 'pending',
      next: ['draft', 'submitted'],
      description: 'Editable by teacher; saves use expected_history_id optimistic lock',
    },
    submitted: {
      state: 'submitted',
      label: 'Submitted',
      badgeVariant: 'scheduled',
      next: ['approved', 'returned'],
      description: 'Awaiting academic review (Approve or Return with mandatory reason)',
    },
    approved: {
      state: 'approved',
      label: 'Approved',
      badgeVariant: 'approved',
      next: [],
      description: 'Locked terminal state after supervisor approval',
    },
    returned: {
      state: 'returned',
      label: 'Returned',
      badgeVariant: 'absent',
      next: ['draft', 'submitted'],
      description: 'Returned by reviewer with feedback; teacher must revise and resubmit',
    },
  },
}

export function deriveReportCapabilities(status?: string | null) {
  const s = (status && status in REPORT_MACHINE.states ? status : 'draft') as ReportStatus
  const meta = REPORT_MACHINE.states[s]
  return {
    status: s,
    meta,
    canEdit: s === 'draft' || s === 'returned',
    canSubmit: s === 'draft' || s === 'returned',
    canReview: s === 'submitted',
    isLocked: s === 'approved',
  }
}

// ── 4. Attendance Machine ───────────────────────────────────
export const ATTENDANCE_MACHINE: StateMachineSpec<AttendanceStatus> = {
  id: 'attendance_mark',
  entity: 'AttendanceRecord',
  initial: 'Unrecorded',
  states: {
    Unrecorded: {
      state: 'Unrecorded',
      label: 'Unrecorded',
      badgeVariant: 'ended',
      next: ['Present', 'Late', 'Absent'],
      description: 'Awaiting initial mark (unlocked only after class ended + held verified)',
    },
    Present: {
      state: 'Present',
      label: 'Present',
      badgeVariant: 'present',
      next: ['Late', 'Absent'],
      description: 'Saved Present; edits require correction reason (or AM-16 approval after 7d)',
    },
    Late: {
      state: 'Late',
      label: 'Late',
      badgeVariant: 'late',
      next: ['Present', 'Absent'],
      description: 'Saved Late; edits require correction reason',
    },
    Absent: {
      state: 'Absent',
      label: 'Absent',
      badgeVariant: 'absent',
      next: ['Present', 'Late'],
      description: 'Saved Absent; may open follow-up case at threshold',
    },
  },
}

// ── 5. Invoice & Payment Machine ────────────────────────────
export const INVOICE_MACHINE: StateMachineSpec<InvoiceStatus> = {
  id: 'invoice_ledger',
  entity: 'Invoice',
  initial: 'unpaid',
  states: {
    unpaid: {
      state: 'unpaid',
      label: 'Unpaid',
      badgeVariant: 'pending',
      next: ['partially_paid', 'paid'],
      description: 'No verified payment posted yet; WhatsApp/Telegram invoice & payment allowed',
    },
    partially_paid: {
      state: 'partially_paid',
      label: 'Partial',
      badgeVariant: 'scheduled',
      next: ['partially_paid', 'paid'],
      description: 'Partial payment posted; balance still open',
    },
    paid: {
      state: 'paid',
      label: 'Paid',
      badgeVariant: 'approved',
      next: [],
      description: 'Settled in full; official digital receipt unlocked',
    },
  },
}

// ── 6. Approval Machines (Leaves / Corrections / Admissions) ──
export const APPROVAL_MACHINE: StateMachineSpec<ApprovalStatus> = {
  id: 'approval_review',
  entity: 'LeaveOrCorrection',
  initial: 'pending',
  states: {
    pending: {
      state: 'pending',
      label: 'Pending',
      badgeVariant: 'pending',
      next: ['approved', 'rejected'],
      description: 'Awaiting coordinator/admin decision',
    },
    approved: {
      state: 'approved',
      label: 'Approved',
      badgeVariant: 'approved',
      next: [],
      description: 'Approved and applied',
    },
    rejected: {
      state: 'rejected',
      label: 'Rejected',
      badgeVariant: 'absent',
      next: [],
      description: 'Rejected',
    },
  },
}

export const ADMISSION_MACHINE: StateMachineSpec<AdmissionStatus> = {
  id: 'admission_review',
  entity: 'AdmissionApplication',
  initial: 'pending',
  states: {
    pending: {
      state: 'pending',
      label: 'Pending',
      badgeVariant: 'pending',
      next: ['accepted', 'rejected'],
      description: 'New applicant awaiting review',
    },
    accepted: {
      state: 'accepted',
      label: 'Accepted',
      badgeVariant: 'approved',
      next: [],
      description: 'Applicant admitted to student roster',
    },
    rejected: {
      state: 'rejected',
      label: 'Rejected',
      badgeVariant: 'absent',
      next: [],
      description: 'Applicant declined',
    },
  },
}

// ── 7. Followup / Payable / Contract Machines ───────────────
export const FOLLOWUP_MACHINE: StateMachineSpec<FollowupStatus> = {
  id: 'followup_case',
  entity: 'AbsenceFollowupCase',
  initial: 'open',
  states: {
    open: {
      state: 'open',
      label: 'Open',
      badgeVariant: 'absent',
      next: ['open', 'closed'],
      description: 'Active outreach/intervention needed for consecutive absences',
    },
    closed: {
      state: 'closed',
      label: 'Closed',
      badgeVariant: 'approved',
      next: [],
      description: 'Follow-up resolved',
    },
  },
}

export const PAYABLE_MACHINE: StateMachineSpec<PayableStatus> = {
  id: 'teacher_payable',
  entity: 'TeacherPayable',
  initial: 'pending',
  states: {
    pending: {
      state: 'pending',
      label: 'Pending',
      badgeVariant: 'pending',
      next: ['paid'],
      description: 'Calculated from held-verified classes, awaiting payout',
    },
    paid: {
      state: 'paid',
      label: 'Paid',
      badgeVariant: 'approved',
      next: [],
      description: 'Teacher remuneration settled',
    },
  },
}

export const CONTRACT_MACHINE: StateMachineSpec<ContractStatus> = {
  id: 'one_to_one_contract',
  entity: 'OneToOneContract',
  initial: 'active',
  states: {
    active: {
      state: 'active',
      label: 'Active',
      badgeVariant: 'approved',
      next: ['paused', 'ended'],
      description: 'Dedicated 1:1 learning contract active',
    },
    paused: {
      state: 'paused',
      label: 'Paused',
      badgeVariant: 'pending',
      next: ['active', 'ended'],
      description: 'Temporarily paused',
    },
    ended: {
      state: 'ended',
      label: 'Ended',
      badgeVariant: 'ended',
      next: [],
      description: 'Completed or terminated 1:1 contract',
    },
  },
}

export function getStatusMeta<S extends string>(
  machine: StateMachineSpec<S>,
  rawStatus: string | null | undefined,
): StateMeta<S> {
  if (rawStatus && rawStatus in machine.states) {
    return machine.states[rawStatus as S]
  }
  return machine.states[machine.initial]
}

export function canTransition<S extends string>(
  machine: StateMachineSpec<S>,
  from: S,
  to: S,
): boolean {
  const meta = machine.states[from]
  return Boolean(meta && meta.next.includes(to))
}

export const ALL_STATE_MACHINES = {
  auth: AUTH_MACHINE,
  classSession: CLASS_SESSION_MACHINE,
  report: REPORT_MACHINE,
  attendance: ATTENDANCE_MACHINE,
  invoice: INVOICE_MACHINE,
  approval: APPROVAL_MACHINE,
  admission: ADMISSION_MACHINE,
  followup: FOLLOWUP_MACHINE,
  payable: PAYABLE_MACHINE,
  contract: CONTRACT_MACHINE,
} as const

// Expose read-only machine registry for AX (DevTools / browser agents)
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__IOM_STATE_MACHINES__ = ALL_STATE_MACHINES
}

