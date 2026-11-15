import * as React from "react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  FileText,
  DollarSign,
  Terminal,
  Menu,
  X,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { apiRequest, type MeUser, type AccountRolesResponse, setCsrfToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type NavKey =
  | "dashboard"
  | "packages-contracts"
  | "invoices"
  | "teacher-payables"
  | "audit";

export interface NavItem {
  key: NavKey;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function getAllowedNav(role: string): NavItem[] {
  const isAdmin = ["central_admin", "branch_admin"].includes(role);
  const isCentral = role === "central_admin";
  const isZimmadar = role === "zimmadar";
  const isGuardian = role.startsWith("guardian");

  const items: NavItem[] = [
    { key: "dashboard", label: "Overview", group: "Main", icon: LayoutDashboard },
    {
      key: "packages-contracts",
      label: "1:1 Packages & Ledger",
      group: "Commercial & Finance",
      icon: Package,
    },
  ];
  if (isAdmin || isGuardian) {
    items.push({
      key: "invoices",
      label: "Tuition Invoices",
      group: "Commercial & Finance",
      icon: FileText,
    });
  }
  if (isAdmin || isZimmadar || role === "teacher") {
    items.push({
      key: "teacher-payables",
      label: "Teacher Compensation",
      group: "Commercial & Finance",
      icon: DollarSign,
    });
  }
  if (isCentral) {
    items.push({
      key: "audit",
      label: "Audit Log",
      group: "Governance",
      icon: Terminal,
    });
  }
  return items;
}

export function AppShell({
  user,
  activeNav,
  onNavigate,
  onLogout,
  toast,
  onDismissToast,
  children,
}: {
  user: MeUser;
  activeNav: NavKey;
  onNavigate: (key: NavKey) => void;
  onLogout: () => void;
  toast: { message: string; tone: "ok" | "err" } | null;
  onDismissToast: () => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  const navItems = getAllowedNav(user.role);
  const groups = Array.from(new Set(navItems.map((i) => i.group)));

  const rolesQuery = useQuery({
    queryKey: ["account-roles", user.id],
    queryFn: () => apiRequest<AccountRolesResponse>("/account/roles"),
    staleTime: 60_000,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        const searchEl = document.querySelector<HTMLInputElement>("[data-search-input]");
        if (searchEl) {
          e.preventDefault();
          searchEl.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleRoleSwitch(val: string) {
    const assignmentId = val ? Number(val) : null;
    const res = await apiRequest<{ ok: boolean; csrf: string }>("/account/role", {
      method: "POST",
      body: { assignment_id: assignmentId },
    });
    setCsrfToken(res.csrf);
    await queryClient.invalidateQueries();
  }

  const activeLabel = navItems.find((n) => n.key === activeNav)?.label || "Overview";
  const assignments = rolesQuery.data?.assignments || [];

  return (
    <div className="min-h-screen flex bg-[#f4f7f9]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#0b192c] text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 lg:static lg:shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-4 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white tracking-tight">
              IOM Itqaan Academy
            </div>
            <div className="text-[11px] text-teal-400 font-medium">
              Modern Workspace · /app
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-5" aria-label="Primary">
          {groups.map((grp) => (
            <div key={grp} className="space-y-1">
              <div className="px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                {grp}
              </div>
              {navItems
                .filter((i) => i.group === grp)
                .map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onNavigate(item.key);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                        active
                          ? "bg-teal-700 text-white shadow-xs"
                          : "text-slate-300 hover:bg-slate-800/70 hover:text-white",
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}

          <div className="pt-3 border-t border-slate-800/80 space-y-1">
            <div className="px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Full Modules
            </div>
            <a
              href="/"
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white"
            >
              <span>Classic Workspace (All Tabs)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 space-y-2">
          <div className="px-1">
            <div className="text-xs font-semibold text-white truncate">{user.name}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {user.email} · <span className="text-teal-400">{user.role}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {activeLabel}
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-500 font-medium">
              Press <kbd className="mx-1 px-1 rounded bg-white border border-slate-300 text-[10px]">/</kbd> to search
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {assignments.length > 0 && (
              <select
                aria-label="Switch active role"
                value={rolesQuery.data?.active_assignment_id ?? ""}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
              >
                <option value="">
                  Base: {rolesQuery.data?.base.role}
                </option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.role}
                    {a.branch_name ? ` (${a.branch_name})` : ""}
                  </option>
                ))}
              </select>
            )}
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              Classic UI <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
          {toast && (
            <div
              role="status"
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs",
                toast.tone === "ok"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800",
              )}
            >
              <div className="flex items-center gap-2">
                {toast.tone === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={onDismissToast}
                className="p-0.5 rounded hover:bg-black/5 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}

