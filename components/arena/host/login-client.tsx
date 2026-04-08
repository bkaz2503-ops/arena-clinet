"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

export function HostLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No pudimos iniciar sesion.");
      }

      router.push(data.redirectTo ?? "/host/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos iniciar sesion."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Acceso del expositor"
      description="Entra al panel del host para crear, preparar y controlar tus eventos."
      compact
    >
      <Panel className="border-arena-100 bg-gradient-to-br from-white to-sky-50/70">
        <div className="space-y-6">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex text-sm font-medium text-arena-700 hover:text-arena-800"
            >
              ← Volver al inicio
            </Link>

            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-arena-700">
                Panel del host
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Inicia sesion para administrar tu evento
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Entra con tu cuenta de expositor para crear, preparar y controlar
                tus eventos.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Aun no tienes cuenta?</p>
              <Link
                href="/host/register"
                className="text-sm font-semibold text-arena-700 hover:text-arena-800"
              >
                Crear cuenta
              </Link>
            </div>
            <p className="mt-3 leading-6">
              Si necesitas seguir usando el acceso de desarrollo, tambien sigue
              disponible:
            </p>
            <p className="mt-2 break-all rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
              host@arena-clinet.local / arena-clinet-host
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="password"
              >
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-arena-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Ingresando..." : "Entrar al dashboard"}
            </button>
          </form>
        </div>
      </Panel>
    </PageShell>
  );
}
