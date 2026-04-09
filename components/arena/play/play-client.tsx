"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { LeaderboardPodium } from "@/components/arena/shared/leaderboard-podium";
import { usePublicEventState } from "@/components/arena/shared/use-public-event-state";
import { getAvatarPath } from "@/lib/avatars";
import { getEventStatusLabel, type EventStatus } from "@/lib/state-machine";

type PublicState = {
  event: {
    id: string;
    title: string;
    pin: string;
    status: string;
    current_question_index: number;
    question_started_at: string | null;
    question_closes_at: string | null;
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
  avatar_id?: string | null;
};

type PlayClientProps = {
  pin: string;
};

const optionToneMap: Record<
  string,
  {
    base: string;
    idle: string;
    hover: string;
    selected: string;
    incorrect: string;
  }
> = {
  A: {
    base: "from-sky-500 to-blue-600",
    idle: "border-sky-300/40 bg-gradient-to-br from-sky-500 to-blue-600 text-white",
    hover: "hover:scale-[1.01] hover:shadow-[0_18px_40px_-20px_rgba(14,165,233,0.7)]",
    selected: "border-sky-100 ring-4 ring-sky-200/40",
    incorrect: "border-rose-200 bg-rose-50 text-rose-900"
  },
  B: {
    base: "from-emerald-500 to-green-600",
    idle: "border-emerald-300/40 bg-gradient-to-br from-emerald-500 to-green-600 text-white",
    hover: "hover:scale-[1.01] hover:shadow-[0_18px_40px_-20px_rgba(16,185,129,0.7)]",
    selected: "border-emerald-100 ring-4 ring-emerald-200/40",
    incorrect: "border-rose-200 bg-rose-50 text-rose-900"
  },
  C: {
    base: "from-orange-400 to-amber-500",
    idle: "border-orange-300/40 bg-gradient-to-br from-orange-400 to-amber-500 text-white",
    hover: "hover:scale-[1.01] hover:shadow-[0_18px_40px_-20px_rgba(249,115,22,0.7)]",
    selected: "border-orange-100 ring-4 ring-orange-200/40",
    incorrect: "border-rose-200 bg-rose-50 text-rose-900"
  },
  D: {
    base: "from-violet-500 to-fuchsia-600",
    idle: "border-violet-300/40 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white",
    hover: "hover:scale-[1.01] hover:shadow-[0_18px_40px_-20px_rgba(139,92,246,0.7)]",
    selected: "border-violet-100 ring-4 ring-violet-200/40",
    incorrect: "border-rose-200 bg-rose-50 text-rose-900"
  }
};

function playSound(src: string) {
  const audio = new Audio(src);
  audio.volume = 0.6;
  void audio.play().catch(() => {});
}

export function PlayClient({ pin }: PlayClientProps) {
  const [state, setState] = useState<PublicState | null>(null);
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<null | {
    is_correct: boolean;
    score_awarded: number;
    total_score: number;
  }>(null);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const hasPlayedVictorySound = useRef(false);
  const isFinalResultsVisible =
    state?.event.status === "leaderboard" || state?.event.status === "finished";
  const showInitialLoading = loading && !state;
  const showBlockingError = !!error && !state;

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

  useEffect(() => {
    setAvatarFailed(false);
  }, [participant?.avatar_id, participant?.display_name]);

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
      setSelectedOptionId(null);
      setSecondsLeft(null);
      return;
    }

    const startedAtMs = state?.event.question_started_at
      ? new Date(state.event.question_started_at).getTime()
      : Date.now();
    const closesAtMs = state?.event.question_closes_at
      ? new Date(state.event.question_closes_at).getTime()
      : startedAtMs + currentQuestion.time_limit_seconds * 1000;
    const initialSecondsLeft = Math.max(
      Math.ceil((closesAtMs - Date.now()) / 1000),
      0
    );

    setQuestionStartedAt(startedAtMs);
    setAnsweredQuestionId(null);
    setAnswerResult(null);
    setPendingQuestionId(null);
    setSelectedOptionId(null);
    setSecondsLeft(initialSecondsLeft);
  }, [
    currentQuestion?.id,
    currentQuestion?.time_limit_seconds,
    state?.event.question_closes_at,
    state?.event.question_started_at
  ]);

  useEffect(() => {
    if (
      state?.event.status !== "question_live" ||
      !currentQuestion ||
      !questionStartedAt
    ) {
      return;
    }

    const closesAtMs = state.event.question_closes_at
      ? new Date(state.event.question_closes_at).getTime()
      : questionStartedAt + currentQuestion.time_limit_seconds * 1000;

    const interval = window.setInterval(() => {
      const remaining = Math.max(Math.ceil((closesAtMs - Date.now()) / 1000), 0);
      setSecondsLeft(remaining);
    }, 250);

    return () => window.clearInterval(interval);
  }, [
    currentQuestion,
    questionStartedAt,
    state?.event.question_closes_at,
    state?.event.status
  ]);

  useEffect(() => {
    if (!isFinalResultsVisible) {
      hasPlayedVictorySound.current = false;
      return;
    }

    if (hasPlayedVictorySound.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      playSound("/sounds/win.mp3");
      hasPlayedVictorySound.current = true;
    }, 420);

    return () => window.clearTimeout(timer);
  }, [isFinalResultsVisible]);

  async function submitAnswer(optionId: string) {
    if (!participant || !currentQuestion || !questionStartedAt) {
      return;
    }

    try {
      setSelectedOptionId(optionId);
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
      setSelectedOptionId(null);
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
  const participantAvatarPath = useMemo(
    () => getAvatarPath(participant?.avatar_id),
    [participant?.avatar_id]
  );
  const participantInitials = useMemo(
    () =>
      (participant?.display_name ?? "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [participant?.display_name]
  );

  function getOptionClass(option: NonNullable<PublicState["current_question"]>["options"][number]) {
    const tone = optionToneMap[option.label] ?? optionToneMap.A;

    if (state?.event.status === "answer_reveal" && option.is_correct) {
      return "border-emerald-200 bg-emerald-400 text-emerald-950 shadow-[0_18px_40px_-20px_rgba(16,185,129,0.75)]";
    }

    if (answerResult && selectedOptionId === option.id) {
      return answerResult.is_correct
        ? "border-emerald-200 bg-emerald-400 text-emerald-950 shadow-[0_18px_40px_-20px_rgba(16,185,129,0.75)]"
        : tone.incorrect;
    }

    if (selectedOptionId === option.id) {
      return `${tone.idle} ${tone.selected}`;
    }

    return `${tone.idle} ${tone.hover}`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="flex min-h-screen flex-col justify-between px-4 py-5 sm:px-6 sm:py-6">
        {showInitialLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-slate-200">Cargando evento...</p>
          </div>
        ) : showBlockingError ? (
          <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center">
            <div className="w-full rounded-3xl border border-red-300/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
              {error}
            </div>
          </div>
        ) : !participant ? (
          <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center">
            <div className="w-full rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur">
              <p className="text-base font-semibold text-white">
                No encontramos tu ingreso para este PIN en este navegador.
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Vuelve a la pantalla de ingreso para unirte otra vez al evento.
              </p>
              <Link
                href="/join"
                className="mt-5 inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900"
              >
                Volver a ingresar
              </Link>
            </div>
          </div>
        ) : !state ? (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-slate-200">Sin datos del evento.</p>
          </div>
        ) : (
          <>
            {error ? (
              <div className="mx-auto mb-4 w-full max-w-5xl rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {error}
              </div>
            ) : null}
            <header className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {state.event.status === "question_live" && currentQuestion
                    ? `Pregunta ${currentQuestion.order_index + 1}`
                    : getEventStatusLabel(state.event.status as EventStatus)}
                </p>
                <p className="text-sm text-slate-200">
                  {participant.display_name}
                </p>
              </div>

              <div className="text-right">
                {state.event.status === "question_live" ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Tiempo restante
                    </p>
                    <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      {secondsLeft ?? "--"}s
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                      PIN
                    </p>
                    <p className="text-xl font-semibold tracking-[0.18em] text-white">
                      {pin}
                    </p>
                  </>
                )}
              </div>
            </header>

            <div className="flex flex-1 flex-col justify-center py-6">
              {(state.event.status === "draft" || state.event.status === "lobby") && (
                <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center shadow-[0_24px_60px_-28px_rgba(15,23,42,0.9)] backdrop-blur">
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-sky-200/20 bg-white/10 shadow-[0_0_32px_rgba(56,189,248,0.18)] ring-4 ring-sky-300/10">
                      {participantAvatarPath && !avatarFailed ? (
                        <Image
                          src={participantAvatarPath}
                          alt={participant.display_name}
                          fill
                          sizes="112px"
                          className="object-cover"
                          onError={() => setAvatarFailed(true)}
                        />
                      ) : null}
                      {!participantAvatarPath || avatarFailed ? (
                        <span className="text-3xl font-semibold tracking-[0.08em] text-white">
                          {participantInitials || "?"}
                        </span>
                      ) : null}
                    </div>

                    <span className="mt-5 inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
                      Listo para jugar
                    </span>

                    <p className="mt-5 text-2xl font-semibold text-white">
                      {participant.display_name}
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-200">
                      Esperando a que el expositor inicie la actividad.
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Cuando empiece la primera pregunta, esta pantalla cambiara
                      automaticamente.
                    </p>
                  </div>
                </div>
              )}

              {state.event.status === "question_live" && currentQuestion ? (
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
                  <div className="space-y-8">
                    <div className="mx-auto max-w-4xl text-center">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200">
                        Responde rapido para sumar mas puntos
                      </p>
                      <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
                        {currentQuestion.statement}
                      </h1>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={!canAnswer || answering}
                          onClick={() => void submitAnswer(option.id)}
                          className={`min-h-24 rounded-[1.8rem] border px-5 py-5 text-left text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-100 sm:min-h-28 sm:text-lg ${getOptionClass(
                            option
                          )}`}
                        >
                          <div className="flex h-full items-start gap-4">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                              {option.label}
                            </span>
                            <span className="leading-7">{option.text}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {answerResult ? (
                      <div className="mx-auto w-full max-w-3xl rounded-[1.8rem] border border-white/15 bg-white/10 px-5 py-4 text-center backdrop-blur">
                        <p className="text-lg font-semibold text-white">
                          {answerResult.is_correct ? "Correcto" : "Respuesta enviada"}
                        </p>
                        <p className="mt-2 text-sm text-slate-200">
                          {answerResult.is_correct
                            ? `Ganaste ${answerResult.score_awarded} puntos. Total: ${answerResult.total_score}.`
                            : "Esperando siguiente pregunta..."}
                        </p>
                      </div>
                    ) : !canAnswer ? (
                      <div className="mx-auto w-full max-w-3xl rounded-[1.8rem] border border-white/15 bg-white/10 px-5 py-4 text-center backdrop-blur">
                        <p className="text-sm text-slate-200">
                          {answeredQuestionId === currentQuestion.id
                            ? "Esperando siguiente pregunta..."
                            : "No puedes responder en este momento."}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {state.event.status === "answer_reveal" && currentQuestion ? (
                <div className="mx-auto w-full max-w-4xl space-y-5 rounded-[2rem] border border-emerald-300/30 bg-white/10 p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.9)] backdrop-blur">
                  <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
                      Respuesta correcta
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                      {currentQuestion.statement}
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentQuestion.options.map((option) => (
                      <div
                        key={option.id}
                        className={`rounded-2xl border px-4 py-4 text-sm sm:text-base ${
                          option.is_correct
                            ? "border-emerald-200 bg-emerald-400 text-emerald-950"
                            : "border-white/15 bg-white/10 text-slate-100"
                        }`}
                      >
                        {option.label}. {option.text}
                      </div>
                    ))}
                  </div>

                  {currentQuestion.explanation ? (
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-slate-100">
                      <p className="font-semibold text-white">Explicacion</p>
                      <p className="mt-2 leading-7">{currentQuestion.explanation}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {(state.event.status === "leaderboard" ||
                state.event.status === "finished") && (
                <div className="mx-auto w-full max-w-5xl space-y-5 rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.9)] backdrop-blur">
                  <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200">
                      Resultados
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                      Asi va el evento
                    </h2>
                  </div>

                  {currentQuestion?.explanation ? (
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-slate-100">
                      <p className="font-semibold text-white">Explicacion</p>
                      <p className="mt-2 leading-7">{currentQuestion.explanation}</p>
                    </div>
                  ) : null}

                  <LeaderboardPodium entries={leaderboard} />

                  <div className="flex flex-col items-center gap-3 pt-2 text-center">
                    <Image
                      src="/logo-clinet.png"
                      alt="CliNet"
                      width={88}
                      height={30}
                      className="h-auto w-24 opacity-85"
                    />
                    <p className="text-sm text-white/70">
                      Educacion medica interactiva impulsada por CliNet
                    </p>
                  </div>
                </div>
              )}
            </div>

            <footer className="flex items-center justify-between gap-4 text-xs text-slate-300 sm:text-sm">
              <span>
                {realtimeConnected
                  ? "Conectado en tiempo real"
                  : "Modo basico (actualizacion cada 2s)"}
              </span>
              <span>{state.event.title}</span>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
