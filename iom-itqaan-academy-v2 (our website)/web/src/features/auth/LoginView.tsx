import * as React from "react";
import { useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { apiRequest, ApiError, setCsrfToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/input";

export function LoginView({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFields({});
    try {
      const res = await apiRequest<{ ok: boolean; csrf: string }>("/login", {
        method: "POST",
        body: { email, password },
      });
      setCsrfToken(res.csrf);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFields(err.fields || {});
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950">
      <Card className="w-full max-w-md border-slate-800/30 shadow-2xl">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              IOM Itqaan Academy
            </h1>
            <p className="text-xs text-slate-500">
              Modern React + TypeScript Admin &amp; Finance Workspace (
              <code className="text-teal-700 font-semibold">/app</code>)
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" error={fields.email}>
              <Input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hasError={Boolean(fields.email)}
                placeholder="admin@gmail.com"
              />
            </FormField>

            <FormField label="Password" error={fields.password}>
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hasError={Boolean(fields.password)}
                placeholder="••••••••"
              />
            </FormField>

            <Button type="submit" variant="primary" className="w-full h-10" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Prefer the classic workspace?</span>
            <a
              href="/"
              className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"
            >
              Open Classic UI <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

