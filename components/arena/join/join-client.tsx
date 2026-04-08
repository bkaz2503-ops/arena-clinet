"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type JoinClientProps = {
  initialPin?: string;
};

export function JoinClient({ initialPin = "" }: JoinClientProps) {
  const router = useRouter();
  const [pin, setPin] = useState(initialPin.toUpperCase());
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      const response = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pin,
          display_name: displayName
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No pudimos ingresar al evento.");
      }

      sessionStorage.setItem(
        `arena-participant:${data.item.event.pin}`,
        JSON.stringify({
          participant_id: data.item.participant.id,
          display_name: data.item.participant.display_name,
          avatar_id: data.item.participant.avatar_id ?? null
        })
      );

      router.push(`/play/${data.item.event.pin}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos ingresar al evento."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled =
    submitting || pin.trim().length < 4 || displayName.trim().length < 2;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 sm:py-8">
      <div className="absolute inset-0">
        <Image
          src="/bg-landing.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-blue-950/35 to-slate-950/75" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.28)_0%,_rgba(129,140,248,0.16)_32%,_rgba(15,23,42,0)_72%)] blur-3xl sm:h-[34rem] sm:w-[34rem]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="w-full max-w-xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100 backdrop-blur-md transition hover:border-sky-300/30 hover:bg-white/14"
            >
              ← Volver
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Acceso rapido
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/8 p-5 shadow-[0_36px_90px_-30px_rgba(8,47,73,0.9)] ring-1 ring-white/10 backdrop-blur-xl sm:p-7">
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <Image
                  src="/logo.png"
                  alt="Arena-CliNet"
                  width={96}
                  height={96}
                  className="h-20 w-20 object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.24)]"
                />
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-white">
                    Unete al evento
                  </h1>
                  <p className="text-sm leading-6 text-white/70">
                    Entra en segundos desde tu celular o PC para responder el caso
                    clinico en vivo.
                  </p>
                </div>
              </div>

              {pin ? (
                <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
                  PIN cargado automaticamente. Solo escribe tu nombre para entrar.
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90" htmlFor="pin">
                    PIN del evento
                  </label>
                  <input
                    id="pin"
                    name="pin"
                    value={pin}
                    onChange={(event) => setPin(event.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base uppercase text-white outline-none transition placeholder:text-white/40 focus:border-sky-300/30 focus:ring-2 focus:ring-blue-400/40"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90" htmlFor="name">
                    Nombre visible
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Dra. Perez"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-white/40 focus:border-sky-300/30 focus:ring-2 focus:ring-blue-400/40"
                    autoComplete="off"
                  />
                </div>

                {error ? (
                  <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 px-5 py-3.5 text-base font-semibold text-white shadow-[0_20px_44px_-16px_rgba(6,182,212,0.75)] transition duration-200 hover:scale-[1.02] hover:from-sky-600 hover:via-cyan-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Ingresando..." : "Entrar al evento"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
