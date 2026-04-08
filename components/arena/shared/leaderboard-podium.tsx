"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { getAvatarPath, getSeededAvatarPath } from "@/lib/avatars";

type LeaderboardEntry = {
  display_name: string;
  avatar_id?: string | null;
  total_score: number;
};

type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[];
};

type PodiumTone = "gold" | "silver" | "bronze";

const podiumStyles: Record<
  PodiumTone,
  {
    container: string;
    badge: string;
    score: string;
    avatar: string;
    name: string;
  }
> = {
  gold: {
    container:
      "border-amber-300/40 bg-gradient-to-b from-slate-50 via-white to-amber-50 shadow-[0_0_90px_rgba(250,204,21,0.22)] ring-2 ring-amber-300/30",
    badge:
      "border border-amber-300/40 bg-amber-100 text-amber-700 shadow-[0_0_20px_rgba(250,204,21,0.18)]",
    score: "text-amber-600",
    avatar: "ring-amber-300/60",
    name: "text-slate-950"
  },
  silver: {
    container:
      "border-slate-300/20 bg-gradient-to-b from-slate-800 to-slate-900 shadow-[0_18px_45px_-28px_rgba(148,163,184,0.35)]",
    badge: "border border-slate-400/25 bg-slate-700 text-slate-100",
    score: "text-slate-200",
    avatar: "ring-slate-300/30",
    name: "text-white"
  },
  bronze: {
    container:
      "border-orange-300/20 bg-gradient-to-b from-orange-950/70 to-slate-900 shadow-[0_18px_45px_-28px_rgba(249,115,22,0.3)]",
    badge: "border border-orange-300/25 bg-orange-400/10 text-orange-100",
    score: "text-orange-200",
    avatar: "ring-orange-300/30",
    name: "text-white"
  }
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function AvatarBadge({
  name,
  avatarId,
  rank,
  size,
  tone
}: {
  name: string;
  avatarId?: string | null;
  rank: number;
  size: number;
  tone: PodiumTone;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarPath = useMemo(
    () => getAvatarPath(avatarId) ?? getSeededAvatarPath(name, rank),
    [avatarId, name, rank]
  );
  const initials = getInitials(name);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full bg-slate-950 ring-4 ${podiumStyles[tone].avatar}`}
      style={{ width: size, height: size }}
    >
      {!imageFailed ? (
        <Image
          src={avatarPath}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {imageFailed ? (
        <span className="text-lg font-semibold text-white">{initials}</span>
      ) : null}
    </div>
  );
}

function PodiumCard({
  entry,
  rank,
  tone,
  emphasized,
  delayMs
}: {
  entry: LeaderboardEntry;
  rank: number;
  tone: PodiumTone;
  emphasized?: boolean;
  delayMs: number;
}) {
  const style = podiumStyles[tone];

  return (
    <div
      className={`rounded-[2rem] border p-5 transition-all duration-300 ${style.container} ${
        emphasized ? "md:px-6 md:py-8" : ""
      }`}
      style={{
        animation: emphasized
          ? `podiumRevealWinner 560ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms both, winnerGlowPulse 820ms ease-out ${delayMs + 120}ms 1 both`
          : `podiumRevealSide 420ms ease-out ${delayMs}ms both`
      }}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.22em] ${style.badge}`}
        >
          {rank === 1 ? "Ganador" : `Puesto ${rank}`}
        </span>

        <div className="mt-4">
          <AvatarBadge
            name={entry.display_name}
            avatarId={entry.avatar_id}
            rank={rank}
            size={emphasized ? 112 : 88}
            tone={tone}
          />
        </div>

        <p
          className={`mt-4 font-semibold tracking-tight ${style.name} ${
            emphasized ? "text-3xl sm:text-4xl" : "text-xl"
          }`}
        >
          {entry.display_name}
        </p>

        <p
          className={`mt-2 font-semibold tracking-tight ${
            emphasized ? "text-2xl sm:text-3xl" : "text-lg"
          } ${style.score}`}
        >
          {entry.total_score} puntos
        </p>
      </div>
    </div>
  );
}

export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const topThree = entries.slice(0, 3);
  const [first, second, third] = topThree;

  return (
    <div className="space-y-6 rounded-[2rem] bg-gradient-to-br from-slate-950 via-[#081633] to-slate-950 p-6 shadow-[0_30px_100px_-30px_rgba(15,23,42,0.95)] ring-1 ring-white/10">
      <style>{`
        @keyframes podiumRevealSide {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes podiumRevealWinner {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.94);
          }
          72% {
            opacity: 1;
            transform: translateY(0) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes winnerGlowPulse {
          0% {
            box-shadow: 0 0 0 rgba(250, 204, 21, 0);
          }
          55% {
            box-shadow: 0 0 72px rgba(250, 204, 21, 0.34);
          }
          100% {
            box-shadow: 0 0 60px rgba(250, 204, 21, 0.22);
          }
        }
      `}</style>

      {first ? (
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          {second ? (
            <PodiumCard entry={second} rank={2} tone="silver" delayMs={80} />
          ) : (
            <div className="hidden md:block" />
          )}

          <div className="md:-translate-y-2">
            <PodiumCard
              entry={first}
              rank={1}
              tone="gold"
              emphasized
              delayMs={180}
            />
          </div>

          {third ? (
            <PodiumCard entry={third} rank={3} tone="bronze" delayMs={120} />
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-200">
          Aun no hay participantes en el ranking.
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={`${entry.display_name}-${index}`}
            className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-sm transition-all duration-200 hover:-translate-y-0.5 ${
              index === 0
                ? "border-amber-300/35 bg-gradient-to-r from-amber-400/12 via-amber-300/10 to-transparent shadow-[0_18px_40px_-30px_rgba(250,204,21,0.35)]"
                : "border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/7"
            }`}
          >
            <div className="flex items-center gap-3">
              <AvatarBadge
                name={entry.display_name}
                avatarId={entry.avatar_id}
                rank={index + 1}
                size={44}
                tone={
                  index === 0
                    ? "gold"
                    : index === 1
                      ? "silver"
                      : index === 2
                        ? "bronze"
                        : "silver"
                }
              />
              <div>
                <p className="font-semibold text-white">
                  {index + 1}. {entry.display_name}
                </p>
                {index === 0 ? (
                  <p className="text-xs font-medium text-amber-200">
                    En primer lugar
                  </p>
                ) : null}
              </div>
            </div>

            <span
              className={`text-base font-semibold ${
                index === 0 ? "text-amber-200" : "text-slate-100"
              }`}
            >
              {entry.total_score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
