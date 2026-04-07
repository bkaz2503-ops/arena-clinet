import type { Metadata } from "next";
import { ReactNode } from "react";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Arena-CliNet",
  description: "MVP para conferencias y casos clínicos interactivos en vivo."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
