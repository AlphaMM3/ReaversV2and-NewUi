import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  apiRequest,
  type AuditEventSummary,
  type AuditEventDetail,
} from "@/lib/api";
import { formatDateTimeDhaka } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { PageSkeleton } from "@/components/ui/skeleton";

export function AuditPage() {
  const [before, setBefore] = useState<number | null>(null);
  const [history, setHistory] = useState<(number | null)[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const pageQ = useQuery({
    queryKey: ["audit-page", before],
    queryFn: () =>
      apiRequest<{ items: AuditEventSummary[]; next_before: number | null }>(
        `/audit/page?limit=50${before ? `&before=${before}` : ""}`,
      ),
  });

  const detailQ = useQuery({
    queryKey: ["audit-detail", selectedId],
    queryFn: () => apiRequest<AuditEventDetail>(`/audit/events/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  if (pageQ.isLoading) return <PageSkeleton />;

  const items = pageQ.data?.items || [];
  const nextBefore = pageQ.data?.next_before ?? null;

  const filtered = items.filter((r) => {
    if (!search.trim()) return true;
    const hay = `${r.id} ${r.action} ${r.entity} ${r.entity_id} ${r.actor_id ?? "system"}`.toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });

  let formattedDetails = detailQ.data?.details || "";
  try {
    if (formattedDetails) {
      formattedDetails = JSON.stringify(JSON.parse(formattedDetails), null, 2);
    }
  } catch {
    // Keep raw text if not valid JSON
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              data-search-input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter current page (action, entity, actor)..."
              className="pl-8 w-64 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={history.length === 0}
              onClick={() => {
                const prev = history[history.length - 1] ?? null;
                setHistory(history.slice(0, -1));
                setBefore(prev);
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Newer
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!nextBefore}
              onClick={() => {
                setHistory([...history, before]);
                setBefore(nextBefore);
              }}
            >
              Older <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">ID</th>
                <th className="py-2.5 px-3">Timestamp (Dhaka)</th>
                <th className="py-2.5 px-3">Actor ID</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono text-slate-600">#{r.id}</td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-700">
                    {formatDateTimeDhaka(r.at)}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {r.actor_id ? (
                      <Badge tone="neutral">User #{r.actor_id}</Badge>
                    ) : (
                      <span className="text-slate-400">System</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{r.action}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {r.entity}#{r.entity_id}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedId(r.id)}>
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet
        open={Boolean(selectedId)}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={selectedId ? `Audit Event #${selectedId}` : "Audit Event"}
        subtitle={
          detailQ.data
            ? `${detailQ.data.action} · ${detailQ.data.entity}#${detailQ.data.entity_id}`
            : undefined
        }
      >
        {detailQ.isLoading ? (
          <p className="text-xs text-slate-500">Loading audit payload...</p>
        ) : detailQ.isError ? (
          <p className="text-xs text-rose-600">{(detailQ.error as Error).message}</p>
        ) : (
          detailQ.data && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="text-slate-500">Actor ID</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {detailQ.data.actor_id ?? "System"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Recorded At</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {formatDateTimeDhaka(detailQ.data.at)}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-700">Event Details JSON</div>
                <pre className="rounded-xl border border-slate-200 bg-slate-950 text-slate-100 p-3.5 overflow-x-auto text-[11.5px] leading-relaxed">
                  {formattedDetails || "{}"}
                </pre>
              </div>
            </div>
          )
        )}
      </Sheet>
    </div>
  );
}

