// Shared SMS, WhatsApp & Telegram formatting/dispatch helpers for Online Academy

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

export interface AbsenteeNotificationData {
  student_name: string
  course_title: string
  batch_name: string
  absent_count: number
  last_absent_date?: string
  guardian_name?: string
}

export interface FeeReminderNotificationData {
  student_name: string
  billing_month: string
  amount_due: number
  due_date: string
  bkash_number?: string
  nagad_number?: string
}

/** Sanitize phone number for Bangladesh and international numbers */
export function sanitizePhone(phone?: string): string {
  if (!phone) return ''
  return phone.replace(/[^\d+]/g, '').trim()
}

/** Standardize phone for WhatsApp wa.me (prepends 88 for BD 01... numbers) */
export function formatPhoneForWhatsApp(phone?: string): string {
  const clean = sanitizePhone(phone).replace(/^\+/, '')
  if (!clean) return ''
  if (clean.startsWith('01') && clean.length === 11) {
    return `88${clean}`
  }
  return clean
}

/**
 * Cross-platform 1-Click SMS link (RFC 5724 compliant)
 * Works seamlessly on iOS (Mobile Safari / Messages) and Android
 */
export function buildSmsUrl(phone: string, text: string): string {
  const cleanPhone = sanitizePhone(phone)
  const encoded = encodeURIComponent(text)
  // On iOS 'sms:phone&body=...' and Android 'sms:phone?body=...'
  // 'sms:phone?body=...' is the RFC standard supported by both modern OS
  return `sms:${cleanPhone}?body=${encoded}`
}

/** Build WhatsApp wa.me deep link */
export function buildWhatsAppUrl(text: string, phone?: string): string {
  const digits = formatPhoneForWhatsApp(phone)
  const encoded = encodeURIComponent(text)
  if (!digits) return `https://wa.me/?text=${encoded}`
  return `https://wa.me/${digits}?text=${encoded}`
}

/** Build Telegram share link */
export function buildTelegramShareUrl(text: string, url = window.location.origin): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
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

/** Build concise absent follow-up message for 1-Click SMS */
export function buildAbsenteeSmsMessage(data: AbsenteeNotificationData): string {
  const prefix = data.guardian_name ? `সম্মানিত অভিভাবক (${data.guardian_name})` : `সম্মানিত অভিভাবক`
  const dateStr = data.last_absent_date ? ` (${data.last_absent_date})` : ''
  return `আসসালামু আলাইকুম। ${prefix}, আপনার সন্তান ${data.student_name} (${data.course_title} - ${data.batch_name}) একাডেমির ক্লাসে ${data.absent_count} দিন অনুপস্থিত ছিল${dateStr}। সন্তানের নিয়মিত উপস্থিতি ও কুরআন শিক্ষায় যত্ন নেওয়ার অনুরোধ করা হলো। - আইওএম ইতকান একাডেমি`
}

/** Build concise tuition fee reminder message for 1-Click SMS */
export function buildFeeReminderSmsMessage(data: FeeReminderNotificationData): string {
  const bkash = data.bkash_number ? ` বিকাশ: ${data.bkash_number}` : ''
  const nagad = data.nagad_number ? ` নগদ: ${data.nagad_number}` : ''
  return `আসসালামু আলাইকুম। আইওএম ইতকান একাডেমি: শিক্ষার্থী ${data.student_name}-এর ${data.billing_month} মাসের টিউশন ফি ৳${data.amount_due.toLocaleString()} বকেয়া রয়েছে (পরিশোধের শেষ তারিখ: ${data.due_date})।${bkash}${nagad}। পরিশোধ শেষে ট্রানজেকশন আইডি পোর্টালে সাবমিট করুন। জাযাকাল্লাহু খাইরান।`
}
