"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useArmazem } from "@/lib/demo/armazem";
import { INSTITUTO } from "@/lib/instituto";
import { GRUPOS_MENU, ITENS_MENU } from "./menu";

const FUNDO = "#10172F";
const BORDA = "#26314A";

export function Marca() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--ns-primary)] text-[11px] font-bold tracking-wide text-white">
        {INSTITUTO.sigla}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold leading-tight text-white">{INSTITUTO.nomeCurto}</span>
        <span className="block truncate text-[11px] font-medium text-[#A9B6D0]">Cadastros e doações</span>
      </span>
    </div>
  );
}

/** Conteúdo do menu, usado na barra fixa do computador e na gaveta do celular. */
export function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  const caminho = usePathname();
  const router = useRouter();
  const { estado, sair } = useArmazem();

  const contagem: Record<string, number> = {
    "/aprovacoes": estado.familias.filter((familia) => familia.situacao === "pendente").length,
    "/atendimento": estado.conversas.reduce((total, conversa) => total + conversa.naoLidas, 0),
  };

  return (
    <nav aria-label="Navegação principal" className="flex h-full w-full flex-col overflow-hidden text-[#C8D1E3]" style={{ background: FUNDO }}>
      <div className="flex h-[74px] shrink-0 items-center border-b px-5" style={{ borderColor: BORDA }}>
        <Marca />
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-3 py-5">
        {GRUPOS_MENU.map((grupo) => (
          <div key={grupo.id} className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8F9BB3]">{grupo.titulo}</span>
            {ITENS_MENU.filter((item) => item.grupo === grupo.id).map((item) => {
              const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
              const Icone = item.icone;
              const avisos = contagem[item.href] ?? 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={aoNavegar}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors ${
                    ativo ? "bg-[var(--ns-primary)] text-white" : "text-[#C8D1E3] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icone aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={ativo ? 2.25 : 1.9} />
                  <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
                  {avisos > 0 && (
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none ${
                        ativo ? "bg-white text-[#10172F]" : "bg-[#E24F63] text-white"
                      }`}
                    >
                      {avisos > 99 ? "99+" : avisos}
                      <span className="sr-only"> pendentes</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t px-3 py-3" style={{ borderColor: BORDA }}>
        <button
          type="button"
          onClick={() => {
            sair();
            router.replace("/login");
          }}
          className="flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-[#C8D1E3] transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.9} />
          Sair
        </button>
      </div>
    </nav>
  );
}
