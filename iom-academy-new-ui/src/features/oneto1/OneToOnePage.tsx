import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { CONTRACT_MACHINE, getStatusMeta } from '@/lib/stateMachines'
import { User, Package, Plus, X } from 'lucide-react'

interface PackageRow {
  id: number
  name: string
  code: string
  total_classes: number
  total_minutes: number
  fee_amount: string | number
  currency: string
  validity_days: number
}

interface ContractRow {
  id: number
  enrollment_id: number
  student_name: string
  package_name: string
  course_title: string | null
  billing_period: string
  allocated_minutes: number
  used_minutes: number
  remaining_minutes: number
  status: string
}

export default function OneToOnePage({ role }: { role: string }) {
  const isAdmin = role === 'central_admin' || role === 'branch_admin'
  const [showNewPkg, setShowNewPkg] = useState(false)
  const [pkgName, setPkgName] = useState('')
  const [pkgCode, setPkgCode] = useState('')
  const [pkgClasses, setPkgClasses] = useState('12')
  const [pkgMinutes, setPkgMinutes] = useState('360')
  const [pkgFee, setPkgFee] = useState('3000')
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: packages = [], isLoading: loadingPkg } = useQuery<PackageRow[]>({
    queryKey: ['1to1-packages'],
    queryFn: () => api.get<PackageRow[]>('/one-to-one/packages'),
  })

  const { data: contracts = [], isLoading: loadingCtr } = useQuery<ContractRow[]>({
    queryKey: ['1to1-contracts'],
    queryFn: () => api.get<ContractRow[]>('/one-to-one/contracts'),
  })

  async function createPackage(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/one-to-one/packages', {
        name: pkgName.trim(),
        code: pkgCode.trim(),
        total_classes: Number(pkgClasses),
        total_minutes: Number(pkgMinutes),
        fee_amount: Number(pkgFee),
      })
      setShowNewPkg(false)
      setPkgName('')
      setPkgCode('')
      toast.success('1:1 package created')
      qc.invalidateQueries({ queryKey: ['1to1-packages'] })
    } catch (err) {
      toast.error(err, 'Failed to create package')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Native 1:1 Module — Packages & Contracts (AM-18)</h2>
          <p className="text-xs text-muted mt-0.5">
            One-to-one hourly packages, student contracts, and live session minute balance ledger
          </p>
        </div>
        {role === 'central_admin' && (
          <Button size="sm" onClick={() => setShowNewPkg(!showNewPkg)}>
            <Plus className="w-4 h-4" /> New 1:1 Package
          </Button>
        )}
      </div>

      {showNewPkg && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Create 1:1 Package</CardTitle>
            <button type="button" onClick={() => setShowNewPkg(false)} className="text-muted"><X className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPackage} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <Input label="Package Name" required placeholder="Hifz 1:1 Monthly" value={pkgName} onChange={(e) => setPkgName(e.target.value)} />
              <Input label="Code" required placeholder="HIFZ-12" value={pkgCode} onChange={(e) => setPkgCode(e.target.value)} />
              <Input label="Classes" type="number" required value={pkgClasses} onChange={(e) => setPkgClasses(e.target.value)} />
              <Input label="Total Minutes" type="number" required value={pkgMinutes} onChange={(e) => setPkgMinutes(e.target.value)} />
              <Input label="Fee (BDT)" type="number" required value={pkgFee} onChange={(e) => setPkgFee(e.target.value)} />
              <Button type="submit" loading={saving}>Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Packages catalog */}
      <div>
        <h3 className="text-sm font-bold text-heading mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-700" /> Available 1:1 Packages
        </h3>
        {loadingPkg ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        ) : packages.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-xs text-muted">No 1:1 packages defined yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {packages.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-heading text-sm">{p.name}</span>
                    <Badge variant="primary">{p.code}</Badge>
                  </div>
                  <p className="text-xs text-muted">{p.total_classes} classes · {p.total_minutes} mins · {p.validity_days}d validity</p>
                  <p className="text-base font-bold text-teal-700 pt-1">{Number(p.fee_amount).toFixed(0)} {p.currency}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Active Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary-700" /> Active 1:1 Student Contracts ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loadingCtr ? (
            <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : contracts.length === 0 ? (
            <p className="text-center py-10 text-xs text-muted">No 1:1 contracts active yet.</p>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Package / Course</th>
                  <th>Billing Period</th>
                  <th>Allocated</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((ct) => {
                  const meta = getStatusMeta(CONTRACT_MACHINE, ct.status)
                  return (
                  <tr key={ct.id} data-entity="one_to_one_contract" data-state={meta.state}>
                    <td className="font-semibold text-heading">{ct.student_name}</td>
                    <td className="text-xs text-muted">{ct.package_name} {ct.course_title ? `· ${ct.course_title}` : ''}</td>
                    <td className="text-xs">{ct.billing_period}</td>
                    <td className="text-xs">{ct.allocated_minutes}m</td>
                    <td className="text-xs text-amber-700">{ct.used_minutes}m</td>
                    <td className="text-xs font-bold text-teal-700">{ct.remaining_minutes}m</td>
                    <td><Badge variant={meta.badgeVariant}>{meta.label}</Badge></td>
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

