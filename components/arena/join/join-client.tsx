"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

export function JoinClient() {
  const router = useRouter();
  const [pin, setPin] = useState("");
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
          display_name: data.item.participant.display_name
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
    <PageShell
      title="Ingresar con PIN"
      description="Escribe el PIN del evento y el nombre que quieres mostrar en el ranking."
      compact
    >
      <Panel>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Cuando el expositor inicie la pregunta, esta pantalla se actualizara
            sola.
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="pin">
                PIN del evento
              </label>
              <input
                id="pin"
                name="pin"
                value={pin}
                onChange={(event) => setPin(event.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none ring-0"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="name">
                Nombre visible
              </label>
              <input
                id="name"
                name="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Dra. Perez"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0"
                autoComplete="off"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={isDisabled}
              className="w-full rounded-xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Ingresando..." : "Entrar al evento"}
            </button>
          </form>
        </div>
      </Panel>
    </PageShell>
  );
}
