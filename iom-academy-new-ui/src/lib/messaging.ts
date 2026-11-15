// Shared WhatsApp & Telegram formatting/share helpers for Online Academy

export interface InvoiceMessageData {
  invoice_number: string
  student_name: string
  course_title: string
  batch_name: string
  billing_month: string
  amount_due: string | number
  amount_paid: string | number
  due_date: string
  status: string
  payment_reference_code?: string | null
}

/** Build formatted Bengali+English invoice or payment receipt message */
export function buildInvoiceText(inv: InvoiceMessageData): string {
  const isPaid = inv.status === 'paid'
  const due = Number(inv.amount_due || 0)
  const paid = Number(inv.amount_paid || 0)
  const balance = Math.max(0, due - paid)

  const header = isPaid
    ? `*IOM Itqaan Academy — Payment Receipt*`
    : `*IOM Itqaan Academy — Tuition Invoice*`

  const lines = [
    header,
    `Invoice No: ${inv.invoice_number}`,
    `Student: ${inv.student_name}`,
    `Course: ${inv.course_title} (${inv.batch_name})`,
    `Billing Month: ${inv.billing_month}`,
    `Total Fee: ${due.toFixed(2)} BDT`,
    `Paid: ${paid.toFixed(2)} BDT`,
    balance > 0 ? `Balance Due: ${balance.toFixed(2)} BDT (Due: ${inv.due_date})` : `Status: PAID IN FULL`,
  ]
  if (inv.payment_reference_code) {
    lines.push(`Payment Ref: ${inv.payment_reference_code}`)
  }
  lines.push(`---`, `JazakAllahu Khairan · IOM Online Academy`)
  return lines.join('\n')
}

/** Build WhatsApp wa.me deep link (accepts BD local 01... or international digits) */
export function buildWhatsAppUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text)
  const raw = (phone || '').replace(/[^\d+]/g, '')
  if (!raw) return `https://wa.me/?text=${encoded}`
  let digits = raw.replace(/^\+/, '')
  if (digits.startsWith('01') && digits.length === 11) {
    digits = `88${digits}`
  }
  return `https://wa.me/${digits}?text=${encoded}`
}

/** Build Telegram share link */
export function buildTelegramShareUrl(text: string, url = window.location.origin): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
}

