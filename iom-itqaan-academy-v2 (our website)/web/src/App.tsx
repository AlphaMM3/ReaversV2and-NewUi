import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, setCsrfToken, type MeUser } from "@/lib/api";
import { LoginView } from "@/features/auth/LoginView";
import { AppShell, getAllowedNav, type NavKey } from "@/features/layout/AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { PackagesContractsPage } from "@/features/commercial/PackagesContractsPage";
import { InvoicesPage } from "@/features/commercial/InvoicesPage";
import { PayablesPage } from "@/features/commercial/PayablesPage";
import { AuditPage } from "@/features/audit/AuditPage";
import { PageSkeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function readHashNav(): NavKey {
  const m = /^#\/?([a-z-]+)$/.exec(window.location.hash || "");
  if (
    m &&
    ["dashboard", "packages-contracts", "invoices", "teacher-payables", "audit"].includes(m[1])
  ) {
    return m[1] as NavKey;
  }
  return "dashboard";
}

function Workspace() {
  const qc = useQueryClient();
  const [nav, setNav] = useState<NavKey>(readHashNav);
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "err" } | null>(null);

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const me = await apiRequest<MeUser>("/me");
      setCsrfToken(me.csrf);
      return me;
    },
  });

  useEffect(() => {
    const onHash = () => setNav(readHashNav());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(next: NavKey) {
    window.location.hash = "#/" + next;
    setNav(next);
  }

  function notify(message: string, tone: "ok" | "err" = "ok") {
    setToast({ message, tone });
    window.setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 4500);
  }

  async function handleLogout() {
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch {
      // Ignore logout transport failures and clear local auth cache
    }
    setCsrfToken(null);
    qc.clear();
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  if (meQ.isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <PageSkeleton />
      </div>
    );
  }

  if (meQ.isError || !meQ.data) {
    return <LoginView onSuccess={() => qc.invalidateQueries({ queryKey: ["me"] })} />;
  }

  const user = meQ.data;
  const allowedKeys = getAllowedNav(user.role).map((n) => n.key);
  const effectiveNav = allowedKeys.includes(nav) ? nav : "dashboard";

  return (
    <AppShell
      user={user}
      activeNav={effectiveNav}
      onNavigate={navigate}
      onLogout={handleLogout}
      toast={toast}
      onDismissToast={() => setToast(null)}
    >
      {effectiveNav === "dashboard" && (
        <DashboardPage user={user} onNotify={notify} onNavigate={navigate} />
      )}
      {effectiveNav === "packages-contracts" && (
        <PackagesContractsPage user={user} onNotify={notify} />
      )}
      {effectiveNav === "invoices" && <InvoicesPage user={user} onNotify={notify} />}
      {effectiveNav === "teacher-payables" && <PayablesPage user={user} onNotify={notify} />}
      {effectiveNav === "audit" && <AuditPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Workspace />
    </QueryClientProvider>
  );
}

