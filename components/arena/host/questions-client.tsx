"use client";

import { useEffect, useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

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

const initialOptions = {
  A: "",
  B: "",
  C: "",
  D: ""
};

export function HostQuestionsClient({ eventId }: HostQuestionsClientProps) {
  const [statement, setStatement] = useState("");
  const [explanation, setExplanation] = useState("");
  const [timeLimit, setTimeLimit] = useState("30");
  const [correctLabel, setCorrectLabel] = useState("A");
  const [options, setOptions] = useState(initialOptions);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadQuestions();
  }, [eventId]);

  async function loadQuestions() {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/questions`, {
        cache: "no-store"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load questions.");
      }

      setQuestions(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch(`/api/events/${eventId}/questions`, {
        method: "POST",
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
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to create question.");
      }

      setStatement("");
      setExplanation("");
      setTimeLimit("30");
      setCorrectLabel("A");
      setOptions(initialOptions);
      setError(null);
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title={`Preguntas del evento ${eventId}`}
      description="Gestión mínima de preguntas conectada al backend actual."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Enunciado
              </label>
              <textarea
                value={statement}
                onChange={(event) => setStatement(event.target.value)}
                className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Explicación
              </label>
              <textarea
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Tiempo límite (segundos)
              </label>
              <input
                value={timeLimit}
                onChange={(event) => setTimeLimit(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
            {(["A", "B", "C", "D"] as const).map((label) => (
              <div key={label} className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Opción {label}
                </label>
                <input
                  value={options[label]}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      [label]: event.target.value
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Opción correcta
              </label>
              <select
                value={correctLabel}
                onChange={(event) => setCorrectLabel(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                {["A", "B", "C", "D"].map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Guardando..." : "Guardar pregunta"}
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Lista de preguntas
            </h2>
            {loading ? (
              <p className="text-sm text-slate-600">Cargando preguntas...</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-slate-600">Todavía no hay preguntas.</p>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      #{question.order_index + 1} {question.statement}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {question.explanation || "Sin explicación"}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {question.time_limit_seconds} segundos
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-700">
                      {question.options.map((option) => (
                        <p key={option.id}>
                          {option.label}. {option.text}
                          {option.is_correct ? " (correcta)" : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
