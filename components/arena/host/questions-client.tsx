"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getEventStatusLabel, type EventStatus } from "@/lib/state-machine";
import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

type EventItem = {
  id: string;
  title: string;
  status: string;
  current_question_index: number;
};

type QuestionItem = {
  id: string;
  statement: string;
  explanation: string;
  time_limit_seconds: number;
  order_index: number;
  options: Array<{
    id: string;
    label: string;
    text: string;
    is_correct: boolean;
  }>;
};

type HostQuestionsClientProps = {
  eventId: string;
};

const optionLabels = ["A", "B", "C", "D"] as const;

const initialOptions = {
  A: "",
  B: "",
  C: "",
  D: ""
};

export function HostQuestionsClient({ eventId }: HostQuestionsClientProps) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [statement, setStatement] = useState("");
  const [explanation, setExplanation] = useState("");
  const [timeLimit, setTimeLimit] = useState("30");
  const [correctLabel, setCorrectLabel] = useState("A");
  const [options, setOptions] = useState(initialOptions);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageQuestions =
    event?.status === "draft" || event?.status === "lobby";

  const eventStatusLabel = event
    ? getEventStatusLabel(event.status as EventStatus)
    : "Cargando";

  const helperText = useMemo(() => {
    if (!event) {
      return "Cargando estado del evento...";
    }

    if (canManageQuestions) {
      return "Puedes crear, editar o eliminar preguntas mientras el evento siga en configuracion o esperando participantes.";
    }

    return `Las preguntas quedan bloqueadas cuando el evento esta en "${eventStatusLabel}".`;
  }, [canManageQuestions, event, eventStatusLabel]);

  useEffect(() => {
    void loadData();
  }, [eventId]);

  async function loadData() {
    try {
      setLoading(true);
      const [eventResponse, questionsResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, { cache: "no-store" }),
        fetch(`/api/events/${eventId}/questions`, {
          cache: "no-store"
        })
      ]);
      const eventData = await eventResponse.json();
      const questionsData = await questionsResponse.json();

      if (!eventResponse.ok) {
        throw new Error(eventData.message ?? "Failed to load event.");
      }

      if (!questionsResponse.ok) {
        throw new Error(questionsData.message ?? "Failed to load questions.");
      }

      setEvent(eventData.item);
      setQuestions(questionsData.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStatement("");
    setExplanation("");
    setTimeLimit("30");
    setCorrectLabel("A");
    setOptions(initialOptions);
    setEditingQuestionId(null);
  }

  function startEditing(question: QuestionItem) {
    setEditingQuestionId(question.id);
    setStatement(question.statement);
    setExplanation(question.explanation);
    setTimeLimit(String(question.time_limit_seconds));
    setOptions({
      A: question.options.find((option) => option.label === "A")?.text ?? "",
      B: question.options.find((option) => option.label === "B")?.text ?? "",
      C: question.options.find((option) => option.label === "C")?.text ?? "",
      D: question.options.find((option) => option.label === "D")?.text ?? ""
    });
    setCorrectLabel(
      question.options.find((option) => option.is_correct)?.label ?? "A"
    );
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageQuestions) {
      setError(
        "Solo puedes cambiar preguntas cuando el evento esta en configuracion o esperando participantes."
      );
      return;
    }

    try {
      setSubmitting(true);
      const isEditing = Boolean(editingQuestionId);
      const response = await fetch(
        isEditing
          ? `/api/questions/${editingQuestionId}`
          : `/api/events/${eventId}/questions`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            statement,
            explanation,
            time_limit_seconds: Number(timeLimit),
            options: Object.entries(options).map(([label, text]) => ({
              label,
              text,
              is_correct: label === correctLabel
            }))
          })
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            (isEditing ? "Failed to update question." : "Failed to create question.")
        );
      }

      resetForm();
      setError(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingQuestionId
            ? "Failed to update question."
            : "Failed to create question."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(question: QuestionItem) {
    if (!canManageQuestions) {
      setError(
        "Solo puedes eliminar preguntas cuando el evento esta en configuracion o esperando participantes."
      );
      return;
    }

    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar esta pregunta?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(question.id);
      const response = await fetch(`/api/questions/${question.id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete question.");
      }

      if (editingQuestionId === question.id) {
        resetForm();
      }

      setError(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete question."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageShell
      title="Preparar preguntas"
      description="Organiza las preguntas del evento y deja lista la sesion antes de salir en vivo."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link
            href={`/host/event/${eventId}`}
            className="text-arena-700 hover:text-arena-800"
          >
            ← Volver al control del evento
          </Link>
          <Link
            href="/host/dashboard"
            className="text-slate-600 hover:text-slate-900"
          >
            ← Volver al dashboard
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
          <Panel className="border-arena-100 bg-gradient-to-br from-white to-sky-50/70">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-arena-700">
                  {editingQuestionId ? "Editar pregunta" : "Nueva pregunta"}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {editingQuestionId
                    ? "Corrige la pregunta antes de salir en vivo"
                    : "Prepara una ronda clara y lista para lanzar"}
                </h2>
                <p className="text-sm leading-6 text-slate-600">{helperText}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
                Estado del evento:{" "}
                <span className="font-semibold text-slate-950">
                  {eventStatusLabel}
                </span>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Enunciado
                  </label>
                  <textarea
                    value={statement}
                    onChange={(event) => setStatement(event.target.value)}
                    placeholder="Escribe el caso o la pregunta principal"
                    className="min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={!canManageQuestions}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Explicacion
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    placeholder="Explica por que la respuesta correcta es la adecuada"
                    className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={!canManageQuestions}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Tiempo limite
                    </label>
                    <input
                      value={timeLimit}
                      onChange={(event) => setTimeLimit(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      disabled={!canManageQuestions}
                    />
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
                    La pregunta se cerrara automaticamente al cumplir este tiempo.
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/85 p-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-950">
                    Opciones de respuesta
                  </h3>
                  <p className="text-sm text-slate-600">
                    Define las opciones A, B, C y D. Luego marca cual es la correcta.
                  </p>
                </div>

                <div className="grid gap-3">
                  {optionLabels.map((label) => {
                    const isCorrect = correctLabel === label;

                    return (
                      <div
                        key={label}
                        className={`rounded-2xl border px-4 py-4 transition ${
                          isCorrect
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {label}
                          </div>

                          <div className="flex-1">
                            <input
                              value={options[label]}
                              onChange={(event) =>
                                setOptions((current) => ({
                                  ...current,
                                  [label]: event.target.value
                                }))
                              }
                              placeholder={`Texto de la opcion ${label}`}
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-arena-400 focus:ring-4 focus:ring-arena-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                              disabled={!canManageQuestions}
                            />
                          </div>

                          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="radio"
                              name="correct-option"
                              checked={isCorrect}
                              onChange={() => setCorrectLabel(label)}
                              className="h-4 w-4 border-slate-300 text-arena-500 focus:ring-arena-200"
                              disabled={!canManageQuestions}
                            />
                            Correcta
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting || !canManageQuestions}
                  className="flex-1 rounded-2xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-arena-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? editingQuestionId
                      ? "Guardando cambios..."
                      : "Guardando..."
                    : editingQuestionId
                      ? "Guardar cambios"
                      : "Guardar pregunta"}
                </button>

                {editingQuestionId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-arena-200 hover:text-arena-700"
                  >
                    Cancelar edicion
                  </button>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel>
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-arena-700">
                  Preguntas cargadas
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Lista del evento
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Revisa rapido el orden, el tiempo y la respuesta correcta de cada pregunta.
                </p>
              </div>

              {loading ? (
                <p className="text-sm text-slate-600">Cargando preguntas...</p>
              ) : questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-600">
                  Todavia no hay preguntas. Crea la primera para empezar a preparar el evento.
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question) => {
                    const correctOption =
                      question.options.find((option) => option.is_correct) ?? null;
                    const canModifyQuestion =
                      canManageQuestions &&
                      question.order_index >= (event?.current_question_index ?? 0);

                    return (
                      <div
                        key={question.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-arena-100 px-3 py-1 text-xs font-semibold text-arena-700">
                                Pregunta #{question.order_index + 1}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {question.time_limit_seconds} segundos
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {question.options.length} opciones
                              </span>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold text-slate-950">
                                {question.statement}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {question.explanation || "Sin explicacion"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            <p className="font-semibold">Respuesta correcta</p>
                            <p className="mt-1">
                              {correctOption
                                ? `${correctOption.label}. ${correctOption.text}`
                                : "No definida"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`rounded-2xl border px-4 py-3 text-sm ${
                                option.is_correct
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="font-semibold">{option.label}.</span>{" "}
                              {option.text}
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => startEditing(question)}
                            disabled={!canModifyQuestion || deletingId !== null}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-arena-200 hover:text-arena-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(question)}
                            disabled={!canModifyQuestion || deletingId === question.id}
                            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === question.id ? "Eliminando..." : "Eliminar"}
                          </button>
                          {!canModifyQuestion ? (
                            <p className="self-center text-xs text-slate-500">
                              Esta pregunta ya no se puede modificar en el estado actual.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
