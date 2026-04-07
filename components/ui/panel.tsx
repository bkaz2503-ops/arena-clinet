import { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
};

export function Panel({ children }: PanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}
