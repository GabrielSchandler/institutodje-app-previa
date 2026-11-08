"use client";

import { useId } from "react";

type PropsCampo = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  erro?: string;
  ajuda?: string;
  opcional?: boolean;
};

/** Campo de texto com rótulo visível, ajuda e erro ligados por aria. */
export function CampoTexto({ rotulo, valor, aoMudar, erro, ajuda, opcional, className = "", ...resto }: PropsCampo) {
  const id = useId();
  const descricao = erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="ns-label">
        {rotulo}
        {opcional && <span className="ml-1 font-normal text-[var(--ns-text-secondary)]">(opcional)</span>}
      </label>
      <input
        id={id}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao}
        className={`ns-input ${erro ? "!border-[var(--ns-danger)]" : ""}`}
        {...resto}
      />
      {erro ? (
        <p id={`${id}-erro`} className="mt-1 text-xs font-medium text-[var(--ns-danger)]">
          {erro}
        </p>
      ) : ajuda ? (
        <p id={`${id}-ajuda`} className="mt-1 text-xs text-[var(--ns-text-secondary)]">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

export function CampoSelecao({
  rotulo,
  valor,
  aoMudar,
  opcoes,
  className = "",
}: {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: Array<{ valor: string; rotulo: string }>;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="ns-label">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(evento) => aoMudar(evento.target.value)} className="ns-input">
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
