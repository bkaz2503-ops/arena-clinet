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
      description="Formulario mínimo para crear un evento y obtener su PIN."
      compact
    >
      <Panel>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="specialty">
              Especialidad
            </label>
            <input
              id="specialty"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creando..." : "Guardar borrador"}
          </button>
        </form>

        {createdEvent ? (
          <div className="mt-6 rounded-2xl border border-arena-100 bg-arena-50 p-4">
            <p className="text-sm font-medium text-slate-700">Evento creado</p>
            <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-arena-700">
              {createdEvent.pin}
            </p>
            <Link
              href={`/host/event/${createdEvent.id}`}
              className="mt-4 inline-flex rounded-xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white"
            >
              Ir al control del evento
            </Link>
          </div>
        ) : null}
      </Panel>
    </PageShell>
  );
}
