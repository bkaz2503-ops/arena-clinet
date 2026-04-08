"use client";

import Link from "next/link";
import { useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

type CreatedEvent = {
  id: string;
  pin: string;
};

export function NewEventClient() {
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          specialty
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to create event.");
      }

      setCreatedEvent(data.item);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Crear evento"
      description="Define el titulo y la especialidad para dejar listo el nuevo evento y obtener su PIN."
      compact
    >
      <Panel className="border-arena-100 bg-gradient-to-br from-white to-sky-50/70">
        <div className="space-y-6">
          <div className="space-y-3">
            <Link
              href="/host/dashboard"
              className="inline-flex text-sm font-medium text-arena-700 hover:text-arena-800"
            >
              ← Volver al dashboard
            </Link>

            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-arena-700">
                Nuevo evento
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Crea el evento y obten su PIN en segundos
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Completa estos datos basicos para generar el borrador del evento
                y seguir luego con las preguntas.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="title">
                Titulo del evento
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Simposio de cardiologia clinica"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="specialty"
              >
                Especialidad
              </label>
              <input
                id="specialty"
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
                placeholder="Ej. Cardiologia"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
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
              {submitting ? "Creando..." : "Crear evento"}
            </button>
          </form>

          {createdEvent ? (
            <div className="rounded-3xl border border-arena-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-arena-700">
                Evento creado
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Ya puedes continuar con la configuracion del evento.
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-[0.2em] text-slate-950">
                {createdEvent.pin}
              </p>
              <Link
                href={`/host/event/${createdEvent.id}`}
                className="mt-5 inline-flex rounded-2xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-arena-700"
              >
                Ir al control del evento
              </Link>
            </div>
          ) : null}
        </div>
      </Panel>
    </PageShell>
  );
}
