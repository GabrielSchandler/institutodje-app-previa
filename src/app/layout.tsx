import type { Metadata, Viewport } from "next";
import { ScriptDeTema } from "@/components/shell/script-de-tema";
import { ProvedorArmazem } from "@/lib/demo/armazem";
import { INSTITUTO } from "@/lib/instituto";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: INSTITUTO.nomeCurto, template: `%s · ${INSTITUTO.nomeCurto}` },
  description: "Cadastro de famílias e controle de doações.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10172F",
};

export default function LayoutRaiz({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {/* O script de tema grava data-theme neste elemento antes da hidratação (evita piscar o tema). */}
        <div id="ns-shell-root" className="ns-shell min-h-dvh" suppressHydrationWarning>
          <ScriptDeTema />
          <ProvedorArmazem>{children}</ProvedorArmazem>
        </div>
      </body>
    </html>
  );
}
