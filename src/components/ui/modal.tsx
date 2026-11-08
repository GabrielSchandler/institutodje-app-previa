"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

/** Modal padrão (base: change-note-modal.tsx do GRSCRM). No celular sobe do rodapé e ocupa a largura toda. */
export function Modal({
  aberto,
  titulo,
  descricao,
  aoFechar,
  children,
  rodape,
  largura = "max-w-xl",
}: {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  largura?: string;
}) {
  const idTitulo = useId();
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    painel.current?.focus();
    const esc = (evento: KeyboardEvent) => evento.key === "Escape" && aoFechar();
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
      anterior?.focus?.();
    };
    // aoFechar muda a cada render do pai; o efeito só deve rodar ao abrir/fechar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Fechar" tabIndex={-1} onClick={aoFechar} className="absolute inset-0 cursor-default bg-[#0B1020]/55" />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full ${largura} flex-col rounded-t-2xl border border-[var(--ns-border)] bg-[var(--ns-surface)] shadow-2xl outline-none sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ns-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-base font-semibold text-[var(--ns-text)]">
              {titulo}
            </h2>
            {descricao && <p className="mt-1 text-sm text-[var(--ns-text-secondary)]">{descricao}</p>}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="-mr-2 -mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--ns-text-secondary)] transition hover:bg-[var(--ns-surface-hover)] hover:text-[var(--ns-text)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--ns-border)] px-5 py-4">{rodape}</div>}
      </div>
    </div>
  );
}
