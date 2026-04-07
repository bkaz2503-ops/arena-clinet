import Link from "next/link";

import { PageShell } from "@/components/ui/page-shell";
import { Panel } from "@/components/ui/panel";
import { StatGrid } from "@/components/ui/stat-grid";

const stats = [
  { label: "Acceso", value: "PIN + nombre" },
  { label: "Preguntas", value: "Opción múltiple" },
  { label: "Puntaje", value: "Acierto + velocidad" },
  { label: "Pantalla", value: "Ranking en vivo" }
];

export default function HomePage() {
  return (
    <PageShell
      title="Casos clínicos interactivos en tiempo real"
      description="Starter inicial para eventos médicos con acceso desde navegador, participación por PIN y control simple para el expositor."
    >
      <StatGrid items={stats} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Flujo principal del MVP
            </h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>1. El host crea un evento y carga preguntas clínicas.</li>
              <li>2. Los asistentes ingresan con PIN y nombre.</li>
              <li>3. El host lanza cada pregunta y controla el ritmo.</li>
              <li>4. El sistema muestra resultados y ranking en vivo.</li>
            </ul>
          </div>
        </Panel>
        <Panel>
          <div className="space-y-3">
            <Link
              href="/join"
              className="block rounded-xl bg-arena-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Ingresar a un evento
            </Link>
            <Link
              href="/host/login"
              className="block rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Acceso del expositor
            </Link>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
