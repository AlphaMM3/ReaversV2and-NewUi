import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, toArray } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/KpiCard'
import { formatDhakaDateTime } from '@/lib/utils'
import { Shield, Search } from 'lucide-react'

interface AuditEvent {
  id: number
  at: string
  actor_id: number | null
  action: string
  entity: string
  entity_id: number
  details?: string
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const { data: events = [], isLoading } = useQuery<AuditEvent[]>({
    queryKey: ['audit'],
    queryFn: () => api.get<AuditEvent[] | { items?: AuditEvent[] }>('/audit').then(toArray),
  })

  const filtered = events.filter((e) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      e.action.toLowerCase().includes(q) ||
      e.entity.toLowerCase().includes(q) ||
      String(e.entity_id).includes(q)
    )
  })

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-700" /> Governance & Audit Log
          </h2>
          <p className="text-xs text-muted mt-0.5">Immutable trail of academy actions, attendance edits, and approvals (BD time)</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Filter action or entity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface w-56"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp (BD)</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr key={ev.id}>
                    <td className="font-mono text-xs">#{ev.id}</td>
                    <td className="text-xs text-muted">{formatDhakaDateTime(ev.at)}</td>
                    <td className="text-xs">User #{ev.actor_id ?? 'system'}</td>
                    <td><Badge variant="primary">{ev.action}</Badge></td>
                    <td className="text-xs font-semibold">{ev.entity} #{ev.entity_id}</td>
                    <td className="text-xs font-mono text-muted max-w-md truncate">{ev.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

