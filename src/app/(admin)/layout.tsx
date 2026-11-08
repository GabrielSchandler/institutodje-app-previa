"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaixaDemo } from "@/components/shell/faixa-demo";
import { Navegacao } from "@/components/shell/navegacao";
import { Carregando } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { pronto, sessao, membroAtual } = useArmazem();
  const liberado = pronto && sessao?.tipo === "admin" && membroAtual !== null;

  // A família nunca entra na área administrativa: volta para a própria área (ou para o login).
  // No sistema real essa barreira fica no servidor; aqui é só a tela.
  useEffect(() => {
    if (pronto && !liberado) router.replace(sessao?.tipo === "familia" ? "/minha-area" : "/login");
  }, [pronto, liberado, sessao, router]);

  if (!liberado) return <Carregando />;

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <div className="hidden w-[250px] shrink-0 md:block">
        <Navegacao />
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--ns-bg)]">
        <FaixaDemo />
        {children}
      </div>
    </div>
  );
}
