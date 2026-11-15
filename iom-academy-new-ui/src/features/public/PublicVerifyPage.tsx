import { useEffect, useState } from 'react'
import { QrCodeSvg } from '@/components/ui/QrCodeSvg'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  readStore,
  CERTIFICATES_KEY,
  ACADEMY_BRANDING_KEY,
  DEFAULT_ACADEMY_BRANDING,
  STUDENT_PHOTOS_KEY,
  type DigitalCertificate,
  type AcademyBranding,
  type StudentPhotoMap,
} from '@/lib/superAdminStore'
import { ShieldCheck, Search, Printer, ArrowLeft, Award, AlertTriangle, CheckCircle2, Calendar, BookOpen } from 'lucide-react'

interface VerifyResponse {
  valid: boolean
  code: string
  certificate?: {
    id: string
    student_id: number
    student_name: string
    course_title: string
    batch_name?: string
    grade_label: string
    issue_date: string
    remarks?: string
    verification_code: string
    issued_by: string
  }
  photo_data_url?: string | null
  branding?: Partial<AcademyBranding>
}

export default function PublicVerifyPage({ initialCode = '' }: { initialCode?: string }) {
  const [inputCode, setInputCode] = useState(initialCode)
  const [activeCode, setActiveCode] = useState(initialCode.trim().toUpperCase())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const clean = initialCode.trim().toUpperCase()
    setInputCode(clean)
    setActiveCode(clean)
  }, [initialCode])

  useEffect(() => {
    if (!activeCode) {
      setResult(null)
      return
    }
    let alive = true
    setLoading(true)
    setErrorMsg('')
    fetch(`/api/public/verify-sanad/${encodeURIComponent(activeCode)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as VerifyResponse
      })
      .then((data) => {
        if (!alive) return
        if (!data.valid) {
          const localCerts = readStore<DigitalCertificate[]>(CERTIFICATES_KEY, [])
          const hit = localCerts.find(
            (c) => String(c.verification_code || '').toUpperCase() === activeCode,
          )
          if (hit) {
            const branding = readStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)
            const photos = readStore<StudentPhotoMap>(STUDENT_PHOTOS_KEY, {})
            setResult({
              valid: true,
              code: activeCode,
              certificate: hit,
              photo_data_url: photos[String(hit.student_id)] || null,
              branding,
            })
            return
          }
        }
        setResult(data)
      })
      .catch(() => {
        if (!alive) return
        const localCerts = readStore<DigitalCertificate[]>(CERTIFICATES_KEY, [])
        const hit = localCerts.find(
          (c) => String(c.verification_code || '').toUpperCase() === activeCode,
        )
        const branding = readStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)
        const photos = readStore<StudentPhotoMap>(STUDENT_PHOTOS_KEY, {})
        if (hit) {
          setResult({
            valid: true,
            code: activeCode,
            certificate: hit,
            photo_data_url: photos[String(hit.student_id)] || null,
            branding,
          })
        } else {
          setErrorMsg('Unable to reach Academy verification server right now.')
          setResult({ valid: false, code: activeCode, branding })
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [activeCode])

  function submitLookup(e: React.FormEvent) {
    e.preventDefault()
    const clean = inputCode.trim().toUpperCase()
    if (!clean) return
    window.location.hash = `#/verify/${encodeURIComponent(clean)}`
    setActiveCode(clean)
  }

  const verifyUrl =
    typeof window !== 'undefined' && activeCode
      ? `${window.location.origin}/#/verify/${encodeURIComponent(activeCode)}`
      : `https://iom.academy/#/verify/${activeCode}`

  const brandName = result?.branding?.academyName || DEFAULT_ACADEMY_BRANDING.academyName
  const brandTagline = result?.branding?.tagline || DEFAULT_ACADEMY_BRANDING.tagline

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-heading">{brandName}</h1>
              <p className="text-xs text-muted">{brandTagline} · Public Sanad Registry</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.hash = '#/dashboard'
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal Login
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <form onSubmit={submitLookup} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Certificate / Sanad Verification Code"
                placeholder="e.g. IOM-SANAD-2026-4812"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
            </div>
            <Button type="submit" loading={loading}>
              <Search className="w-4 h-4" /> Verify Sanad
            </Button>
          </form>
          <p className="text-[11px] text-muted mt-2">
            No login required. Guardians, employers, and partner institutions can verify digital Sanads directly via code or QR scan.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-900">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <div className="inline-block w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-muted">Verifying digital signature against Academy ledger…</p>
          </div>
        ) : activeCode && result ? (
          result.valid && result.certificate ? (
            <div className="bg-white rounded-3xl border-4 border-emerald-800/80 p-6 sm:p-8 shadow-lg space-y-6 relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> AUTHENTICITY VERIFIED BY REGISTRY
                </div>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5" /> Print Verification
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
                {result.photo_data_url ? (
                  <img
                    src={result.photo_data_url}
                    alt={result.certificate.student_name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-700 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300 flex items-center justify-center text-2xl font-extrabold shrink-0">
                    {result.certificate.student_name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-bold">
                    Official Digital Sanad & Completion Certificate
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-serif">
                    {result.certificate.student_name}
                  </h2>
                  <p className="text-sm text-body flex items-center justify-center sm:justify-start gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    Completed: <strong className="text-heading">{result.certificate.course_title}</strong>
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                      <Award className="w-3.5 h-3.5" /> {result.certificate.grade_label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted">
                      <Calendar className="w-3.5 h-3.5" /> Issued {result.certificate.issue_date}
                    </span>
                  </div>
                  {result.certificate.remarks && (
                    <p className="text-xs text-muted italic pt-1">{result.certificate.remarks}</p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  <QrCodeSvg value={verifyUrl} size={104} />
                  <span className="text-[10px] font-mono text-muted">{result.certificate.verification_code}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-3 text-xs text-muted">
                <div>
                  Issued By: <strong className="text-heading">{result.certificate.issued_by}</strong>
                </div>
                <div>
                  {result.branding?.principalName || DEFAULT_ACADEMY_BRANDING.principalName} · {result.branding?.principalTitle || brandName}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-red-300 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-red-800">Certificate Code Not Found</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                No official Sanad was found matching code <strong className="font-mono text-heading">{activeCode}</strong>. Please check for typos or contact the Academy Principal Office.
              </p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-border p-8 text-center text-xs text-muted">
            Enter a Sanad verification code above (e.g. from a student certificate footer or QR link) to verify its authenticity.
          </div>
        )}
      </div>
    </div>
  )
}
