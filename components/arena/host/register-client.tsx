"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

type RegisterForm = {
  name: string;
  profession: string;
  institution: string;
  country: string;
  email: string;
  whatsapp: string;
  password: string;
};

const initialForm: RegisterForm = {
  name: "",
  profession: "",
  institution: "",
  country: "",
  email: "",
  whatsapp: "",
  password: ""
};

export function HostRegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof RegisterForm>(
    field: K,
    value: RegisterForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No pudimos crear tu cuenta.");
      }

      router.push(data.redirectTo ?? "/host/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos crear tu cuenta."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Registro de expositor"
      description="Crea tu cuenta para preparar y controlar eventos con Arena-CliNet."
      compact
    >
      <Panel className="border-arena-100 bg-gradient-to-br from-white to-sky-50/70">
        <div className="space-y-6">
          <div className="space-y-3">
            <Link
              href="/host/login"
              className="inline-flex text-sm font-medium text-arena-700 hover:text-arena-800"
            >
              ← Ya tengo cuenta
            </Link>

            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-arena-700">
                Cuenta de expositor
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Registra tu acceso al panel host
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Guardaremos tus datos basicos para que puedas crear eventos reales
                y dar seguimiento a tu actividad.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="name">
                  Nombre completo
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                  placeholder="Ej. Dra. Mariana Lopez"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="profession">
                  Profesion
                </label>
                <input
                  id="profession"
                  value={form.profession}
                  onChange={(event) =>
                    updateField("profession", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                  placeholder="Ej. Medico internista"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="institution">
                  Centro de salud o institucion
                </label>
                <input
                  id="institution"
                  value={form.institution}
                  onChange={(event) =>
                    updateField("institution", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                  placeholder="Ej. Clinica San Gabriel"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="country">
                  Pais
                </label>
                <input
                  id="country"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                  placeholder="Ej. Peru"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="whatsapp">
                  WhatsApp (opcional)
                </label>
                <input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(event) => updateField("whatsapp", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                  placeholder="Ej. +51 999 999 999"
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Correo electronico
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                  placeholder="tu@institucion.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Contrasena
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>
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
              {submitting ? "Creando cuenta..." : "Crear cuenta de expositor"}
            </button>
          </form>
        </div>
      </Panel>
    </PageShell>
  );
}
