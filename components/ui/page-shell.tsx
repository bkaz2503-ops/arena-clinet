import Link from "next/link";
import { ReactNode } from "react";
import clsx from "clsx";

type PageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
};

export function PageShell({
  title,
  description,
  children,
  compact = false
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-arena-50 to-white px-4 py-10">
      <div
        className={clsx(
          "mx-auto flex w-full flex-col gap-6",
          compact ? "max-w-2xl" : "max-w-6xl"
        )}
      >
        <header className="space-y-3">
          <Link
            href="/"
            className="inline-flex rounded-full bg-arena-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-arena-700"
          >
            Arena-CliNet
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              {description}
            </p>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
