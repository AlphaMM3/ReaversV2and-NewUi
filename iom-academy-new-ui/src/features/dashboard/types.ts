export interface InvoiceMini {
  id: number
  enrollment_id: number
  contract_id: number | null
  invoice_number: string
  student_name: string
  course_title: string
  batch_name: string
  billing_month: string
  amount_due: string | number
  amount_paid: string | number
  due_date: string
  status: 'unpaid' | 'partially_paid' | 'paid'
  payment_reference_code: string | null
  notes: string | null
}

export interface PayableMini {
  id: number
  billing_month: string
  payable_amount: string | number
  status: string
  course_title?: string | null
}

export interface MonthlyAttendanceRow {
  enrollment_id: number
  student_name: string
  course_title: string
  batch_name: string
  delivery_mode?: string
  held_classes: number
  present_count: number
  late_count: number
  absent_count: number
  attendance_pct: number | null
}

export interface EnrollmentMini {
  id: number
  batch_id: number
  batch_name?: string
  course_title?: string
  delivery_mode?: string
  status: string
  start_date?: string
  created_at?: string
}

export interface UserMini {
  id: number
  name: string
  role: string
  active?: number | boolean
}

export interface LeaveMini {
  id: number
  enrollment_id: number
  student_name?: string
  start_date: string
  end_date: string
  status: string
}

export interface AdmissionMini {
  id: number
  applicant_name: string
  status: string
  created_at?: string
}

export interface FollowupMini {
  id: number
  enrollment_id: number
  student_name?: string
  course_title?: string
  status: string
}

export interface AcademicSessionMini {
  id: number
  label: string
  start_date: string
  end_date: string
}

export interface AssessmentMini {
  id: number
  title: string
  batch_name?: string
  course_title?: string
  max_marks: number
  published: number | boolean
}

export interface ResourceMini {
  id: number
  title: string
  course_title?: string
  url: string
}

export interface AnnouncementMini {
  id: number
  title: string
  body: string
  created_at: string
}

export interface TelegramStatus {
  linked: boolean
  configuration_required: boolean
}
