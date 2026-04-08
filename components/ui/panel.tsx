import clsx from "clsx";
import { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}
