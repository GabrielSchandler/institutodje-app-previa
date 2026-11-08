"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useArmazem } from "@/lib/demo/armazem";
import { iniciais } from "@/lib/formatos";
import { BotaoTema } from "./botao-tema";
import { Navegacao } from "./navegacao";

/** Celular: o menu lateral vira gaveta, aberta pelo botão da barra do topo. Fecha ao navegar, no Esc ou tocando fora. */
function MenuCelular() {
  const [aberto, setAberto] = useState(false);
  const caminho = usePathname();

  useEffect(() => setAberto(false), [caminho]);
  useEffect(() => {
    if (!aberto) return;
    const esc = (evento: KeyboardEvent) => evento.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--ns-border)] text-[var(--ns-text)] md:hidden"
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>
      {aberto && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" onClick={() => setAberto(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 w-[270px] max-w-[85vw] shadow-xl">
            <Navegacao aoNavegar={() => setAberto(false)} />
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="absolute right-2 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#C8D1E3]"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function BarraTopo({ titulo, descricao, acoes }: { titulo: string; descricao?: string; acoes?: React.ReactNode }) {
  const { membroAtual } = useArmazem();

  return (
    <header className="flex min-h-[74px] shrink-0 items-center gap-3 border-b border-[var(--ns-border)] bg-[var(--ns-surface)] px-3 py-3 sm:px-6">
      <MenuCelular />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold leading-tight text-[var(--ns-text)] sm:text-xl">{titulo}</h1>
        {descricao && <p className="mt-0.5 hidden truncate text-sm text-[var(--ns-text-secondary)] sm:block">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
      <BotaoTema />
      {membroAtual && (
        <div className="hidden items-center gap-2 rounded-[10px] border border-[var(--ns-border)] px-2.5 py-1.5 lg:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ns-primary)]/15 text-[11px] font-semibold text-[var(--ns-primary)]">
            {iniciais(membroAtual.nome)}
          </span>
          <span className="text-xs leading-tight">
            <span className="block font-semibold text-[var(--ns-text)]">{membroAtual.nome}</span>
            <span className="block capitalize text-[var(--ns-text-secondary)]">{membroAtual.papel}</span>
          </span>
        </div>
      )}
    </header>
  );
}
