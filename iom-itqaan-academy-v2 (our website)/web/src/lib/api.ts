export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = options.method || (options.body !== undefined ? "POST" : "GET");
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (method !== "GET" && method !== "HEAD") {
    headers["x-csrf-token"] = csrfToken || "";
  }

  const res = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await res.json().catch(() => ({ detail: "Unexpected server response" }));
  if (!res.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : JSON.stringify(payload?.detail || "Request failed");
    const fields =
      payload?.fields && typeof payload.fields === "object"
        ? (payload.fields as Record<string, string>)
        : undefined;
    throw new ApiError(detail, res.status, fields);
  }
  return payload as T;
}

export interface MeUser {
  id: number;
  name: string;
  email: string;
  role: string;
  branch_id: number | null;
  department_id: number | null;
  base_role: string;
  csrf: string;
}

export interface RoleAssignment {
  id: number;
  role: string;
  branch_id: number | null;
  department_id: number | null;
  branch_name: string | null;
  department_name: string | null;
}

export interface AccountRolesResponse {
  base: { role: string; branch_id: number | null; department_id: number | null };
  active_assignment_id: number | null;
  assignments: RoleAssignment[];
}

export interface DashboardSummary {
  students: number;
  enrollments: number;
  classes: number;
  group_enrollments: number;
  one_to_one_enrollments: number;
  active_enrollments: number;
}

export interface ClassSessionRow {
  id: number;
  batch_id: number;
  course_title: string;
  batch_name: string;
  delivery_mode: string;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
  held_verified: number | boolean;
  meeting_url?: string | null;
}

export interface EnrollmentRow {
  id: number;
  student_id: number;
  student_name: string;
  course_title: string;
  batch_id: number;
  batch_name: string;
  delivery_mode: string;
  status: string;
}

export interface CommercialPackage {
  id: number;
  name: string;
  code: string;
  total_classes: number;
  total_minutes: number;
  fee_amount: string | number;
  currency: string;
  validity_days: number;
  active: number;
}

export interface OneToOneContract {
  id: number;
  enrollment_id: number;
  package_id: number;
  student_name: string;
  package_name: string;
  batch_name: string | null;
  course_title: string | null;
  billing_period: string;
  start_date: string;
  end_date: string;
  allocated_minutes: number;
  used_minutes: number;
  remaining_minutes: number;
  fee_amount: string | number;
  currency: string;
  status: string;
}

export interface LedgerEntry {
  id: number;
  contract_id: number;
  class_session_id: number | null;
  entry_type: string;
  minutes: number;
  balance_after: number;
  recorded_by: number;
  recorded_by_name: string | null;
  recorded_at: string;
  notes: string | null;
}

export interface TuitionInvoice {
  id: number;
  enrollment_id: number;
  contract_id: number | null;
  invoice_number: string;
  student_name: string;
  course_title: string;
  batch_name: string;
  billing_month: string;
  amount_due: string | number;
  amount_paid: string | number;
  due_date: string;
  status: string;
  payment_reference_code: string | null;
  notes: string | null;
}

export interface TeacherPayable {
  id: number;
  teacher_id: number;
  teacher_name: string | null;
  teacher_email: string | null;
  class_session_id: number;
  course_title: string | null;
  billing_month: string;
  conducted_minutes: number;
  hourly_rate: string | number;
  payable_amount: string | number;
  status: string;
  calculated_at: string;
}

export interface AuditEventSummary {
  id: number;
  at: string;
  actor_id: number | null;
  action: string;
  entity: string;
  entity_id: number;
}

export interface AuditEventDetail extends AuditEventSummary {
  details: string;
}

