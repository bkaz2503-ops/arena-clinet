"use client";

import { useState } from "react";

import { usePublicEventState } from "@/components/arena/shared/use-public-event-state";
import { getEventStatusLabel, type EventStatus } from "@/lib/state-machine";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";

type LiveClientProps = {
  pin: string;
};

type LiveState = {
  event: {
    id: string;
    title: string;
    pin: string;
    status: string;
    current_question_index: number;
  };
  leaderboard: Array<{
    display_name: string;
    total_score: number;
  }>;
  current_question: null | {
    id: string;
    statement: string;
    explanation: string;
    order_index: number;
    options: Array<{
      id: string;
      label: string;
      text: string;
      is_correct?: boolean;
    }>;
  };
};

export function LiveClient({ pin }: LiveClientProps) {
  const [state, setState] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { realtimeConnected } = usePublicEventState<LiveState>({
    pin,
    onState: setState,
    onError: setError,
    onLoading: setLoading
  });

  return (
    <PageShell
      title={`Pantalla publica ${pin}`}
      description="Vista publica minima con estado del evento, pregunta activa y ranking."
    >
      <StatGrid
        items={[
          {
            label: "Estado",
            value: state
              ? getEventStatusLabel(state.event.status as EventStatus)
              : "-"
          },
          { label: "PIN", value: state?.event.pin ?? pin },
          {
            label: "Pregunta actual",
            value: state?.current_question
              ? String(state.current_question.order_index + 1)
              : "-"
          },
          {
            label: "Participantes top",
            value: String(state?.leaderboard.length ?? 0)
          }
        ]}
      />
      <Panel>
        {loading ? (
          <p className="text-sm text-slate-600">Cargando pantalla publica...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !state ? null : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {state.event.title}
              </h2>
              <p className="mt-2 text-3xl font-semibold tracking-[0.25em] text-arena-700">
                {state.event.pin}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {realtimeConnected
                  ? "Conectado en tiempo real"
                  : "Modo basico (actualizacion cada 2s)"}
              </p>
            </div>

            {(state.event.status === "draft" || state.event.status === "lobby") && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                El evento esta listo. Comparte este PIN con los participantes para
                que puedan ingresar desde sus celulares o PCs.
              </div>
            )}

            {state.current_question ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Pregunta #{state.current_question.order_index + 1}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {state.current_question.statement}
                </p>
                <div className="grid gap-2 text-sm text-slate-700">
                  {state.current_question.options.map((option) => (
                    <div
                      key={option.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      {option.label}. {option.text}
                      {option.is_correct ? " (correcta)" : ""}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(state.event.status === "leaderboard" ||
              state.event.status === "finished") && (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-slate-900">Resultados</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {state.leaderboard.map((entry, index) => (
                    <div
                      key={`${entry.display_name}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Puesto {index + 1}
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">
                        {entry.display_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.total_score} puntos
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
