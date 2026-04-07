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
      title="Dashboard de eventos"
      description="Listado simple de eventos del expositor para probar el flujo del MVP."
    >
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Eventos creados
            </h2>
            <p className="text-sm text-slate-600">
              Consulta en vivo desde el backend actual.
            </p>
          </div>
          <Link
            href="/host/event/new"
            className="rounded-xl bg-arena-500 px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Crear evento
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-600">Cargando eventos...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-slate-600">Todavia no hay eventos.</p>
          ) : (
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Titulo</th>
                  <th className="px-3 py-3 font-medium">Especialidad</th>
                  <th className="px-3 py-3 font-medium">PIN</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 text-slate-900">{event.title}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {event.specialty}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-900">
                      {event.pin}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {getEventStatusLabel(event.status as EventStatus)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/host/event/${event.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        Abrir control
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </PageShell>
  );
}
