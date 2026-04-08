"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getEventStatusLabel, type EventStatus } from "@/lib/state-machine";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

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

  const statusLabel = event
    ? getEventStatusLabel(event.status as EventStatus)
    : "Cargando";

  const nextStepMessage =
    event?.status === "draft"
      ? "Puedes iniciar el evento cuando ya tengas participantes conectados."
      : event?.status === "lobby"
        ? `Lanza la pregunta #${nextQuestionNumber} para comenzar la ronda.`
        : event?.status === "question_live"
          ? "La pregunta esta en curso. Cuando termine, revela la respuesta o muestra resultados."
          : event?.status === "answer_reveal"
            ? "La respuesta ya esta visible. Ahora puedes mostrar resultados o seguir con la siguiente pregunta."
            : event?.status === "leaderboard"
              ? `Muestra la siguiente pregunta (#${nextQuestionNumber}) o finaliza el evento.`
              : "El evento ya finalizo. Puedes dejar esta pantalla abierta como referencia final.";

  return (
    <PageShell
      title={event?.title ?? `Control del evento ${eventId}`}
      description="Controla el ritmo del evento, lanza preguntas y guia la sesion en vivo."
    >
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel className="border-arena-100 bg-gradient-to-br from-white to-sky-50/70">
            {loading ? (
              <p className="text-sm text-slate-600">Cargando evento...</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                  <Link href="/host/dashboard" className="text-arena-700 hover:text-arena-800">
                    ← Volver al dashboard
                  </Link>
                  <Link
                    href={`/host/event/${eventId}/questions`}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Administrar preguntas
                  </Link>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex rounded-full bg-arena-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-arena-700">
                      Control del evento
                    </div>
                    <div>
                      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                        {event?.title}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {event?.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[22rem]">
                    <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        PIN
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[0.18em] text-slate-950">
                        {event?.pin ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Estado
                      </p>
                      <p className="mt-2 text-sm font-semibold text-arena-700">
                        {statusLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Pregunta activa
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      {currentQuestion
                        ? `#${currentQuestion.order_index + 1}`
                        : "Todavia no hay una pregunta en curso"}
                    </p>
                    {currentQuestion ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {currentQuestion.statement}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Elige una pregunta y sigue el flujo del evento para lanzarla.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-arena-100 bg-arena-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-arena-700">
                      Paso actual
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      {event?.status === "draft" && "Puedes iniciar el evento"}
                      {event?.status === "lobby" && "Lanza la siguiente pregunta"}
                      {event?.status === "question_live" && "Espera y luego revela la respuesta"}
                      {event?.status === "answer_reveal" && "Muestra resultados o sigue"}
                      {event?.status === "leaderboard" && "Continua con la siguiente ronda"}
                      {event?.status === "finished" && "Evento finalizado"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {nextStepMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  Acciones del host
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Sigue el flujo del evento. Los botones se activan solo cuando corresponde.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Pregunta para lanzar o revelar
                </label>
                <select
                  value={selectedQuestionId}
                  onChange={(event) => setSelectedQuestionId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100"
                >
                  <option value="">Selecciona una pregunta</option>
                  {questions.map((question) => (
                    <option key={question.id} value={question.id}>
                      #{question.order_index + 1} {question.statement}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void runAction("start")}
                  disabled={actionLoading !== null || !canStart}
                  className="rounded-2xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-arena-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Iniciar evento
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("launch")}
                  disabled={actionLoading !== null || !canLaunch}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-arena-200 hover:text-arena-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lanzar pregunta
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("reveal")}
                  disabled={actionLoading !== null || !canReveal}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-arena-200 hover:text-arena-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Revelar respuesta
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("leaderboard")}
                  disabled={actionLoading !== null || !canShowLeaderboard}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-arena-200 hover:text-arena-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mostrar resultados
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("finish")}
                  disabled={actionLoading !== null || !canFinish}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 xl:col-span-1"
                >
                  Finalizar evento
                </button>
              </div>

              {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-950">
                Atajos utiles
              </h3>
              <Link
                href={`/host/event/${eventId}/questions`}
                className="block rounded-2xl bg-arena-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-arena-700"
              >
                Administrar preguntas
              </Link>
              <Link
                href={`/live/${event?.pin ?? ""}`}
                className="block rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-arena-200 hover:text-arena-700"
              >
                Abrir pantalla publica
              </Link>
            </div>
          </Panel>

          <Panel>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-950">
                Resumen rapido
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Estado actual:{" "}
                  <span className="font-semibold text-slate-900">{statusLabel}</span>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Pregunta seleccionada:{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedQuestion
                      ? `#${selectedQuestion.order_index + 1}`
                      : "Ninguna"}
                  </span>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Siguiente pregunta esperada:{" "}
                  <span className="font-semibold text-slate-900">
                    #{Math.max(nextQuestionNumber, 1)}
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
