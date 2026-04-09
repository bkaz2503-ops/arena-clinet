"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

import { LeaderboardPodium } from "@/components/arena/shared/leaderboard-podium";
import { usePublicEventState } from "@/components/arena/shared/use-public-event-state";
import { getAvatarPath, getSeededAvatarPath } from "@/lib/avatars";
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
    id: string;
    display_name: string;
    avatar_id?: string | null;
    total_score: number;
    joined_at: string;
  }>;
  participants: Array<{
    id: string;
    display_name: string;
    avatar_id?: string | null;
    total_score: number;
    joined_at: string;
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

function playSound(src: string) {
  const audio = new Audio(src);
  audio.volume = 0.6;
  void audio.play().catch(() => {});
}

export function LiveClient({ pin }: LiveClientProps) {
  const [state, setState] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<string, boolean>>(
    {}
  );
  const hasPlayedVictorySound = useRef(false);
  const isFinalResultsVisible =
    state?.event.status === "leaderboard" || state?.event.status === "finished";
  const showInitialLoading = loading && !state;
  const showBlockingError = !!error && !state;

  const { realtimeConnected } = usePublicEventState<LiveState>({
    pin,
    onState: setState,
    onError: setError,
    onLoading: setLoading
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setJoinUrl(`${window.location.origin}/join?pin=${encodeURIComponent(pin)}`);
  }, [pin]);

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

  return (
    <PageShell
      title={`Pantalla publica ${pin}`}
      description="Vista publica del evento para proyectar PIN, QR, pregunta y resultados."
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
        {showInitialLoading ? (
          <p className="text-sm text-slate-600">Cargando pantalla publica...</p>
        ) : showBlockingError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : !state ? null : (
          <div className="space-y-8">
            {error ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </p>
            ) : null}
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="rounded-[2rem] bg-gradient-to-r from-arena-700 to-arena-500 p-8 text-white shadow-xl shadow-arena-200">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                  Evento en vivo
                </p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                  {state.event.title}
                </h2>
                <p className="mt-6 text-sm uppercase tracking-[0.22em] text-white/70">
                  PIN del evento
                </p>
                <p className="mt-2 text-5xl font-semibold tracking-[0.28em] sm:text-6xl">
                  {state.event.pin}
                </p>
                <p className="mt-4 text-sm text-white/80">
                  {realtimeConnected
                    ? "Conectado en tiempo real"
                    : "Modo basico (actualizacion cada 2s)"}
                </p>
              </div>

              {joinUrl ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/70">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <QRCode value={joinUrl} size={180} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-950">
                        Escanea para unirte
                      </p>
                      <p className="text-sm text-slate-600">
                        O entra manualmente con este PIN
                      </p>
                      <p className="text-2xl font-semibold tracking-[0.18em] text-arena-700">
                        {state.event.pin}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {(state.event.status === "draft" || state.event.status === "lobby") && (
              <div className="space-y-6 rounded-[2rem] border border-white/15 bg-slate-950/65 p-6 text-white shadow-[0_28px_80px_-36px_rgba(15,23,42,0.95)] ring-1 ring-white/10 backdrop-blur-xl">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200">
                      Esperando participantes
                    </p>
                    <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      {state.participants.length > 0
                        ? "La sala ya se esta llenando"
                        : "Todo listo para comenzar"}
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 text-slate-200">
                      {state.participants.length > 0
                        ? "Ya se estan uniendo al evento. Esperando a que el expositor inicie la actividad."
                        : "Comparte el PIN o el QR para que los participantes entren desde sus celulares o PCs."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                        Participantes listos
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {state.participants.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/80">
                        PIN del evento
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-white">
                        {state.event.pin}
                      </p>
                    </div>
                  </div>
                </div>

                {state.participants.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-200">
                      {state.participants.length >= 6
                        ? "La sala esta casi lista."
                        : "Cada nuevo participante aparece aqui en tiempo real."}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {state.participants.map((participant, index) => {
                      const avatarPath =
                        getAvatarPath(participant.avatar_id) ??
                        getSeededAvatarPath(participant.display_name, index + 1);
                      const initials = participant.display_name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? "")
                        .join("");
                      const showFallback =
                        !avatarPath || failedAvatarIds[participant.id];

                      return (
                        <div
                          key={participant.id}
                          className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_-30px_rgba(14,165,233,0.45)] transition-all duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-200/20 bg-slate-900 shadow-[0_0_24px_rgba(56,189,248,0.18)] ring-4 ring-sky-300/10">
                              {!showFallback ? (
                                <Image
                                  src={avatarPath}
                                  alt={participant.display_name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  onError={() =>
                                    setFailedAvatarIds((current) => ({
                                      ...current,
                                      [participant.id]: true
                                    }))
                                  }
                                />
                              ) : (
                                <span className="text-lg font-semibold tracking-[0.08em] text-white">
                                  {initials || "?"}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-white">
                                {participant.display_name}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-sky-100/75">
                                Listo para jugar
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-5 py-6 text-sm text-slate-200">
                    <p className="font-semibold text-white">
                      Aun no hay participantes unidos
                    </p>
                    <p className="mt-2 leading-6 text-slate-300">
                      Comparte el PIN del evento para comenzar. Esta pantalla se
                      actualizara sola cuando empiecen a entrar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {state.current_question ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/60">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Pregunta #{state.current_question.order_index + 1}
                    </p>
                    {state.event.status === "answer_reveal" ? (
                      <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        Respuesta correcta
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-6">
                    <p className="text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                      {state.current_question.statement}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {state.current_question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`rounded-2xl border px-5 py-4 text-base ${
                          option.is_correct
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {option.label}
                        </span>
                        {option.text}
                        {option.is_correct ? " (correcta)" : ""}
                      </div>
                    ))}
                  </div>
                  {(state.event.status === "answer_reveal" ||
                    state.event.status === "leaderboard" ||
                    state.event.status === "finished") &&
                  state.current_question.explanation ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Explicacion</p>
                      <p className="mt-2 leading-7">
                        {state.current_question.explanation}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {(state.event.status === "leaderboard" ||
              state.event.status === "finished") && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/60">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-950">Resultados</p>
                </div>
                <LeaderboardPodium entries={state.leaderboard} />
                <div className="flex flex-col items-center gap-3 pt-2 text-center">
                  <Image
                    src="/logo-clinet.png"
                    alt="CliNet"
                    width={92}
                    height={32}
                    className="h-auto w-24 opacity-80"
                  />
                  <p className="text-sm text-slate-600">
                    Educacion medica interactiva impulsada por CliNet
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
