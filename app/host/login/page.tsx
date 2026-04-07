import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";

export default function HostLoginPage() {
  return (
    <PageShell
      title="Acceso del expositor"
      description="Base simple de autenticación para el host. Sin flujos avanzados en esta etapa."
      compact
    >
      <Panel>
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-arena-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Ingresar
          </button>
        </form>
      </Panel>
    </PageShell>
  );
}
