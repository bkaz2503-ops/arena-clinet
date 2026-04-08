"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getEventStatusLabel, type EventStatus } from "@/lib/state-machine";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

type EventItem = {
  id: string;
  title: string;
  specialty: string;
  pin: string;
  status: string;
};

export function HostDashboardClient() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const response = await fetch("/api/events", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "No pudimos cargar los eventos.");
        }

        setEvents(data.items ?? []);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No pudimos cargar los eventos."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEvents();
  }, []);

  return (
    <PageShell
      title="Tus eventos"
      description="Crea, revisa y abre el control de cada evento desde un solo lugar."
    >
      <Panel className="border-arena-100 bg-gradient-to-br from-white to-sky-50/70">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Link href="/" className="inline-flex text-sm font-medium text-arena-700 hover:text-arena-800">
              ← Volver al inicio
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-arena-700">
                Panel del expositor
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Tus eventos
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Abre un evento existente o crea uno nuevo para empezar una sesion.
              </p>
            </div>
          </div>
          <Link
            href="/host/event/new"
            className="inline-flex items-center justify-center rounded-2xl bg-arena-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-arena-700"
          >
            Crear evento
          </Link>
        </div>
      </Panel>

      <div className="grid gap-4">
        {loading ? (
          <Panel>
            <p className="text-sm text-slate-600">Cargando eventos...</p>
          </Panel>
        ) : error ? (
          <Panel>
            <p className="text-sm text-red-600">{error}</p>
          </Panel>
        ) : events.length === 0 ? (
          <Panel>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-950">
                Todavia no hay eventos
              </h3>
              <p className="text-sm text-slate-600">
                Crea tu primer evento para empezar a probar el flujo del host.
              </p>
            </div>
          </Panel>
        ) : (
          events.map((event) => (
            <Panel key={event.id} className="border-slate-200 bg-white">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-950">
                      {event.title}
                    </h3>
                    <span className="rounded-full bg-arena-50 px-3 py-1 text-xs font-semibold text-arena-700">
                      {getEventStatusLabel(event.status as EventStatus)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>{event.specialty}</span>
                    <span className="font-mono font-semibold tracking-[0.18em] text-slate-900">
                      PIN {event.pin}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/live/${event.pin}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-arena-200 hover:text-arena-700"
                  >
                    Ver pantalla publica
                  </Link>
                  <Link
                    href={`/host/event/${event.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-arena-700"
                  >
                    Abrir control
                  </Link>
                </div>
              </div>
            </Panel>
          ))
        )}
      </div>
    </PageShell>
  );
}
