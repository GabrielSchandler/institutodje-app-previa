"use client";

import { CentralAtendimento } from "@/components/atendimento/central";
import { BarraTopo } from "@/components/shell/barra-topo";

export default function PaginaAtendimento() {
  return (
    <>
      <BarraTopo titulo="Atendimento" descricao="WhatsApp do instituto: a assistente virtual responde primeiro e a equipe assume quando precisa." />
      <div className="min-h-0 flex-1">
        <CentralAtendimento />
      </div>
    </>
  );
}
