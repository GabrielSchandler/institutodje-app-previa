import type { LucideIcon } from "lucide-react";
import { Check, Clock } from "lucide-react";
import type { Etapa, Familia, SituacaoCadastro, TipoDoacao } from "@/lib/demo/tipos";

export function SeloSituacao({ situacao }: { situacao: SituacaoCadastro }) {
  const mapa = {
    pendente: ["ns-badge-warning", "Aguardando aprovação"],
    aprovado: ["ns-badge-success", "Aprovado"],
    recusado: ["ns-badge-danger", "Recusado"],
  } as const;
  const [classe, rotulo] = mapa[situacao];
  return <span className={`ns-badge ${classe} whitespace-nowrap`}>{rotulo}</span>;
}

export function SeloEtapa({ etapa }: { etapa: Etapa | undefined }) {
  if (!etapa) return null;
  return (
    <span className="ns-badge ns-badge-neutral gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: etapa.cor }} />
      {etapa.titulo}
    </span>
  );
}

/** Selo da família na lista: recusado tem prioridade; senão mostra a etapa da esteira. */
export function SeloAndamento({ familia, etapas }: { familia: Familia; etapas: Etapa[] }) {
  if (familia.situacao === "recusado") return <SeloSituacao situacao="recusado" />;
  return <SeloEtapa etapa={etapas.find((etapa) => etapa.id === familia.etapaId)} />;
}

/** Itens pedidos pela família; os já entregues aparecem marcados. */
export function ChipsDoacao({ familia, tipos, compacto = false }: { familia: Familia; tipos: TipoDoacao[]; compacto?: boolean }) {
  const entregues = new Set(familia.entregas.map((entrega) => entrega.tipoId));
  if (familia.doacoesSolicitadas.length === 0) return <span className="text-xs text-[var(--ns-text-secondary)]">Nenhum item informado</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {familia.doacoesSolicitadas.map((tipoId) => {
        const nome = tipos.find((tipo) => tipo.id === tipoId)?.nome ?? "Item removido";
        const recebido = entregues.has(tipoId);
        return (
          <li
            key={tipoId}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium ${compacto ? "text-[11px]" : "text-xs"} ${
              recebido
                ? "border-[color-mix(in_srgb,var(--ns-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--ns-success)_10%,transparent)] text-[var(--ns-success)]"
                : "border-[var(--ns-border)] bg-[var(--ns-surface)] text-[var(--ns-text)]"
            }`}
          >
            {recebido ? <Check aria-hidden="true" className="h-3 w-3" /> : <Clock aria-hidden="true" className="h-3 w-3 text-[var(--ns-text-secondary)]" />}
            {nome}
            <span className="sr-only">{recebido ? " (recebido)" : " (aguardando)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function EstadoVazio({ icone: Icone, titulo, texto, children }: { icone: LucideIcon; titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--ns-border)] px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ns-surface-alt)] text-[var(--ns-text-secondary)]">
        <Icone aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[var(--ns-text)]">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-[var(--ns-text-secondary)]">{texto}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Par rótulo/valor das fichas. */
export function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-[var(--ns-text-secondary)]">{rotulo}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-[var(--ns-text)]">{children || "—"}</dd>
    </div>
  );
}

export function Carregando() {
  return (
    <div className="flex min-h-[40dvh] flex-1 items-center justify-center text-sm text-[var(--ns-text-secondary)]" role="status">
      Carregando…
    </div>
  );
}
