"use client";

import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";

const PIN_LENGTH = 6;
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"]
});

function normalizePin(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, PIN_LENGTH);
}

export default function HomePage() {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pinChars = useMemo(() => {
    const chars = pin.split("");

    return Array.from({ length: PIN_LENGTH }, (_, index) => chars[index] ?? "");
  }, [pin]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleFocusInput() {
    inputRef.current?.focus();
  }

  return (
    <main className="relative h-screen min-h-[100svh] overflow-hidden bg-slate-950 px-4 sm:px-6">
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
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-blue-950/35 to-slate-950/70" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.32)_0%,_rgba(129,140,248,0.18)_30%,_rgba(15,23,42,0)_72%)] blur-3xl sm:h-[38rem] sm:w-[38rem]" />

      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div
          className="flex w-full max-w-4xl flex-col items-center justify-start pt-10 pb-6 text-center sm:pt-12 sm:pb-8"
          style={{ animation: "landing-fade-scale 420ms ease-out both" }}
        >
          <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-4">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <Image
              src="/logo.png"
              alt="Arena-CliNet"
              width={320}
              height={320}
              className="h-32 w-32 object-contain drop-shadow-[0_0_40px_rgba(56,189,248,0.34)] sm:h-40 sm:w-40"
            />
            <p
              className={`${spaceGrotesk.className} mt-2 text-sm font-semibold uppercase tracking-[0.32em] text-sky-100 drop-shadow-[0_2px_12px_rgba(56,189,248,0.16)] sm:text-base`}
            >
              Arena-CliNet
            </p>
            <p className="mt-1 max-w-sm text-sm leading-5 text-slate-100">
              Casos clinicos interactivos en vivo
            </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-1.5 text-sm font-semibold text-sky-100 shadow-sm shadow-sky-950/40">
                <span aria-hidden="true">⚡</span>
                <span>Responde en tiempo real</span>
              </div>

              <h1 className="text-[1.85rem] font-semibold leading-[0.96] tracking-[-0.04em] text-white sm:text-[2.35rem] lg:text-[2.8rem]">
                Entra con tu PIN
                <br />
                y responde en segundos
              </h1>
              <p className="mx-auto max-w-lg text-sm leading-5 text-slate-100 sm:text-base">
                Ingresa tu PIN y comienza.
              </p>
            </div>

            <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/30 bg-white/16 p-4 shadow-[0_42px_120px_-26px_rgba(8,47,73,0.9)] ring-1 ring-white/12 backdrop-blur-xl sm:p-5">
              <div className="space-y-4 text-left">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                    Acceso rapido
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">
                    Ingresa a un evento
                  </h2>
                  <p className="mt-1.5 text-sm leading-5 text-slate-100">
                    Si ya tienes tu PIN, entra directo desde aqui.
                  </p>
                </div>

                <form action="/join" method="get" className="space-y-3">
                  <input type="hidden" name="pin" value={pin} />

                  <div className="space-y-2">
                    <label
                      htmlFor="pin-code"
                      className="text-sm font-medium text-slate-100"
                    >
                      PIN del evento
                    </label>

                    <div className="relative">
                      <input
                        ref={inputRef}
                        id="pin-code"
                        value={pin}
                        onChange={(event) => setPin(normalizePin(event.target.value))}
                        onPaste={(event) => {
                          event.preventDefault();
                          setPin(normalizePin(event.clipboardData.getData("text")));
                        }}
                        autoFocus
                        maxLength={PIN_LENGTH}
                        inputMode="text"
                        autoComplete="off"
                        className="absolute inset-0 h-full w-full opacity-0"
                      />

                      <button
                        type="button"
                        onClick={handleFocusInput}
                        className="grid w-full grid-cols-6 gap-2 rounded-[1.5rem] border border-white/35 bg-white/18 p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition duration-200 hover:border-sky-300 focus:outline-none focus:ring-8 focus:ring-sky-300/30"
                      >
                        {pinChars.map((char, index) => (
                          <span
                            key={`${char}-${index}`}
                            className={`flex h-11 items-center justify-center rounded-[1rem] border text-lg font-semibold uppercase transition sm:h-12 sm:text-xl ${
                              char
                                ? "border-sky-200/70 bg-white text-slate-950 shadow-lg shadow-sky-950/20"
                                : "border-white/20 bg-white/10 text-slate-300"
                            } font-mono tracking-[0.16em]`}
                          >
                            {char || "•"}
                          </span>
                        ))}
                      </button>
                    </div>

                    <p className="pl-1 font-mono text-xs tracking-[0.24em] text-slate-200/80">
                      Ej: JSGEZE
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 px-6 py-2.5 text-base font-semibold text-white shadow-[0_24px_48px_-16px_rgba(6,182,212,0.8)] transition duration-200 hover:scale-105 hover:from-sky-600 hover:via-cyan-500 hover:to-blue-600 hover:shadow-[0_26px_54px_-16px_rgba(14,116,144,0.85)]"
                  >
                    Ingresar a un evento
                  </button>
                </form>

                <Link
                  href="/host/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-6 py-2.5 text-base font-semibold text-slate-50 shadow-sm transition hover:border-sky-300/40 hover:bg-white/16 hover:text-white"
                >
                  Acceso del expositor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes landing-fade-scale {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}
