"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getEventStatusLabel, type EventStatus } from "@/lib/state-machine";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";

type EventItem = {
  id: string;
  title: string;
  specialty: string;
  pin: string;
  status: string;
  current_question_index: number;
};

type QuestionItem = {
  id: string;
  statement: string;
  order_index: number;
};

type HostControlClientProps = {
  eventId: string;
};

export function HostControlClient({ eventId }: HostControlClientProps) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const currentQuestion = useMemo(
    () =>
      questions.find(
        (question) => question.order_index === event?.current_question_index
      ) ?? null,
    [event?.current_question_index, questions]
  );

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) ?? null,
    [questions, selectedQuestionId]
  );

  const canStart = event?.status === "draft";
  const canLaunch =
    !!event &&
    !!selectedQuestion &&
    (event.status === "lobby" ||
      event.status === "answer_reveal" ||
      event.status === "leaderboard") &&
    selectedQuestion.order_index ===
      (event.status === "lobby"
        ? event.current_question_index
        : event.current_question_index + 1);
  const canReveal =
    !!event &&
    !!selectedQuestion &&
    event.status === "question_live" &&
    selectedQuestion.order_index === event.current_question_index;
  const canShowLeaderboard =
    event?.status === "question_live" || event?.status === "answer_reveal";
  const canFinish = !!event && event.status !== "finished";
  const nextQuestionNumber =
    event?.status === "lobby"
      ? (event.current_question_index ?? 0) + 1
      : (event?.current_question_index ?? 0) + 2;

  useEffect(() => {
    void loadData();
  }, [eventId]);

  async function loadData() {
    try {
      setLoading(true);
      const [eventResponse, questionsResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, { cache: "no-store" }),
        fetch(`/api/events/${eventId}/questions`, { cache: "no-store" })
      ]);
      const eventData = await eventResponse.json();
      const questionsData = await questionsResponse.json();

      if (!eventResponse.ok) {
        throw new Error(eventData.message ?? "No pudimos cargar el evento.");
      }

      if (!questionsResponse.ok) {
        throw new Error(questionsData.message ?? "No pudimos cargar las preguntas.");
      }

      setEvent(eventData.item);
      setQuestions(questionsData.items ?? []);
      setSelectedQuestionId((current) => {
        if (
          current &&
          (questionsData.items ?? []).some((item: QuestionItem) => item.id === current)
        ) {
          return current;
        }

        return questionsData.items?.[0]?.id ?? "";
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos cargar el evento."
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    action: "start" | "reveal" | "leaderboard" | "finish" | "launch"
  ) {
    if (!event) {
      return;
    }

    if ((action === "launch" || action === "reveal") && !selectedQuestionId) {
      setError("Selecciona una pregunta para continuar.");
      return;
    }

    const endpointMap = {
      start: `/api/events/${event.id}/start`,
      reveal: `/api/events/${event.id}/questions/${selectedQuestionId}/reveal`,
      leaderboard: `/api/events/${event.id}/leaderboard`,
      finish: `/api/events/${event.id}/finish`,
      launch: `/api/events/${event.id}/questions/${selectedQuestionId}/launch`
    };

    try {
      setActionLoading(action);
      setMessage(null);
      const response = await fetch(endpointMap[action], { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No pudimos completar la accion.");
      }

      setMessage(`Accion "${action}" ejecutada correctamente.`);
      setError(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos completar la accion."
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <PageShell
      title={`Control del evento ${eventId}`}
      description="Control minimo del host para cambiar el estado del evento y lanzar preguntas."
    >
      <StatGrid
        items={[
          {
            label: "Estado",
            value: event ? getEventStatusLabel(event.status as EventStatus) : "-"
          },
          { label: "PIN", value: event?.pin ?? "-" },
          {
            label: "Pregunta actual",
            value: String((event?.current_question_index ?? 0) + 1)
          },
          {
            label: "Seleccionada",
            value: selectedQuestion
              ? String(selectedQuestion.order_index + 1)
              : "-"
          }
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          {loading ? (
            <p className="text-sm text-slate-600">Cargando evento...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {event?.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {event?.specialty} - PIN {event?.pin}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Estado actual:{" "}
                  {event ? getEventStatusLabel(event.status as EventStatus) : "-"}
                </p>
                {currentQuestion ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Pregunta activa: #{currentQuestion.order_index + 1}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {event?.status === "draft" &&
                  "Paso siguiente: inicia el evento cuando ya tengas participantes conectados."}
                {event?.status === "lobby" &&
                  `Paso siguiente: lanza la pregunta #${nextQuestionNumber}.`}
                {event?.status === "question_live" &&
                  "Paso siguiente: cuando termine la ronda, revela la respuesta o muestra resultados."}
                {event?.status === "answer_reveal" &&
                  "Paso siguiente: muestra resultados o lanza la siguiente pregunta."}
                {event?.status === "leaderboard" &&
                  `Paso siguiente: lanza la pregunta #${nextQuestionNumber} o finaliza el evento.`}
                {event?.status === "finished" &&
                  "El evento ya termino. Puedes dejar esta pantalla abierta para revisar el estado final."}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Pregunta para lanzar o revelar
                </label>
                <select
                  value={selectedQuestionId}
                  onChange={(event) => setSelectedQuestionId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Selecciona una pregunta</option>
                  {questions.map((question) => (
                    <option key={question.id} value={question.id}>
                      #{question.order_index + 1} {question.statement}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void runAction("start")}
                  disabled={actionLoading !== null || !canStart}
                  className="rounded-xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Iniciar evento
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("launch")}
                  disabled={actionLoading !== null || !canLaunch}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Lanzar pregunta
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("reveal")}
                  disabled={actionLoading !== null || !canReveal}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Revelar respuesta
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("leaderboard")}
                  disabled={actionLoading !== null || !canShowLeaderboard}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Mostrar resultados
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("finish")}
                  disabled={actionLoading !== null || !canFinish}
                  className="rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60 sm:col-span-2"
                >
                  Finalizar evento
                </button>
              </div>

              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          )}
        </Panel>

        <Panel>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Navegacion</h2>
            <Link
              href={`/host/event/${eventId}/questions`}
              className="block rounded-xl bg-arena-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Administrar preguntas
            </Link>
            <Link
              href={`/live/${event?.pin ?? ""}`}
              className="block rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Abrir pantalla publica
            </Link>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
