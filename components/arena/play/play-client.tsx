"use client";

import { useEffect, useMemo, useState } from "react";

import { usePublicEventState } from "@/components/arena/shared/use-public-event-state";
import { getEventStatusLabel, type EventStatus } from "@/lib/state-machine";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

type PublicState = {
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
    time_limit_seconds: number;
    order_index: number;
    options: Array<{
      id: string;
      label: string;
      text: string;
      is_correct?: boolean;
    }>;
  };
};

type ParticipantSession = {
  participant_id: string;
  display_name: string;
};

type PlayClientProps = {
  pin: string;
};

export function PlayClient({ pin }: PlayClientProps) {
  const [state, setState] = useState<PublicState | null>(null);
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<null | {
    is_correct: boolean;
    score_awarded: number;
    total_score: number;
  }>(null);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);

  const currentQuestion = state?.current_question ?? null;
  const canAnswer =
    state?.event.status === "question_live" &&
    !!participant &&
    !!currentQuestion &&
    answeredQuestionId !== currentQuestion.id &&
    pendingQuestionId !== currentQuestion.id;

  useEffect(() => {
    const raw = sessionStorage.getItem(`arena-participant:${pin}`);

    if (raw) {
      setParticipant(JSON.parse(raw) as ParticipantSession);
    }
  }, [pin]);

  const { loadState, realtimeConnected } = usePublicEventState<PublicState>({
    pin,
    onState: setState,
    onError: setError,
    onLoading: setLoading
  });

  useEffect(() => {
    if (!currentQuestion) {
      setQuestionStartedAt(null);
      setAnsweredQuestionId(null);
      setAnswerResult(null);
      setPendingQuestionId(null);
      return;
    }

    setQuestionStartedAt(Date.now());
    setAnsweredQuestionId(null);
    setAnswerResult(null);
    setPendingQuestionId(null);
  }, [currentQuestion?.id]);

  async function submitAnswer(optionId: string) {
    if (!participant || !currentQuestion || !questionStartedAt) {
      return;
    }

    try {
      setPendingQuestionId(currentQuestion.id);
      setAnswering(true);
      const responseTimeMs = Date.now() - questionStartedAt;
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          participant_id: participant.participant_id,
          question_id: currentQuestion.id,
          option_id: optionId,
          response_time_ms: responseTimeMs
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No pudimos registrar tu respuesta.");
      }

      setAnsweredQuestionId(currentQuestion.id);
      setAnswerResult(data.item);
      await loadState();
    } catch (err) {
      setPendingQuestionId(null);
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos registrar tu respuesta."
      );
    } finally {
      setAnswering(false);
    }
  }

  const leaderboard = useMemo(() => state?.leaderboard ?? [], [state?.leaderboard]);

  return (
    <PageShell
      title={`Participando en ${pin}`}
      description="Vista minima del participante conectada al backend del MVP."
      compact
    >
      <Panel>
        {loading ? (
          <p className="text-sm text-slate-600">Cargando evento...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !participant ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              No encontramos tu ingreso para este PIN en este navegador.
            </p>
            <p className="text-sm text-slate-500">
              Vuelve a la pantalla de ingreso para unirte otra vez al evento.
            </p>
          </div>
        ) : !state ? (
          <p className="text-sm text-slate-600">Sin datos del evento.</p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Estado actual
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                {getEventStatusLabel(state.event.status as EventStatus)}
              </h2>
              <p className="text-sm text-slate-600">
                Participante: {participant?.display_name ?? "No identificado"}
              </p>
              <p className="text-xs text-slate-500">
                {realtimeConnected
                  ? "Conectado en tiempo real"
                  : "Modo basico (actualizacion cada 2s)"}
              </p>
            </div>

            {state.event.status === "draft" || state.event.status === "lobby" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Espera a que el expositor inicie la actividad. Cuando la pregunta
                se publique, podras responder desde esta misma pantalla.
              </div>
            ) : null}

            {state.event.status === "question_live" && currentQuestion ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Pregunta #{currentQuestion.order_index + 1}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {currentQuestion.statement}
                  </p>
                </div>
                <div className="grid gap-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      disabled={!canAnswer || answering}
                      onClick={() => void submitAnswer(option.id)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-left text-sm font-medium text-slate-700 disabled:opacity-60"
                    >
                      {option.label}. {option.text}
                    </button>
                  ))}
                </div>
                {!canAnswer ? (
                  <p className="text-sm text-slate-500">
                    {answeredQuestionId === currentQuestion.id
                      ? "Ya respondiste esta pregunta."
                      : "No puedes responder en este momento."}
                  </p>
                ) : null}
                {answerResult ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p>Correcta: {answerResult.is_correct ? "Si" : "No"}</p>
                    <p>Puntos: {answerResult.score_awarded}</p>
                    <p>Total: {answerResult.total_score}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {state.event.status === "answer_reveal" && currentQuestion ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">
                  Respuesta correcta
                </p>
                <p className="text-sm text-slate-700">{currentQuestion.statement}</p>
                <p className="text-sm text-slate-500">
                  Revisa la opcion correcta y espera los resultados de la ronda.
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  {currentQuestion.options.map((option) => (
                    <p key={option.id}>
                      {option.label}. {option.text}
                      {option.is_correct ? " (correcta)" : ""}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {(state.event.status === "leaderboard" ||
              state.event.status === "finished") && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Ranking</p>
                <p className="text-sm text-slate-500">
                  Estos son los resultados actuales del evento.
                </p>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={`${entry.display_name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    >
                      <span>
                        {index + 1}. {entry.display_name}
                      </span>
                      <span className="font-semibold">{entry.total_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.event.status === "finished" ? (
              <p className="text-sm font-semibold text-slate-700">
                El evento ha finalizado.
              </p>
            ) : null}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
