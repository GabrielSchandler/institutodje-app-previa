"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useArmazem } from "@/lib/demo/armazem";
import type { Etapa } from "@/lib/demo/tipos";
import { novoId } from "@/lib/formatos";

const ROTULO_PAPEL = {
  entrada: "Etapa de entrada: recebe os cadastros novos.",
  fila: "Etapa da fila: recebe os cadastros aprovados.",
  concluida: "Etapa de conclusão: recebe quem teve a entrega registrada.",
} as const;

const CORES_SUGERIDAS = ["#E7A11F", "#5267F5", "#12A976", "#8B5CF6", "#0EA5E9", "#E24F63", "#64748B"];

/** Editor das etapas da esteira (base: legal-workflow-editor.tsx do GRSCRM). */
export function EditorEsteira({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const { estado, salvarEtapas } = useArmazem();
  const [etapas, setEtapas] = useState<Etapa[]>(estado.etapas);

  useEffect(() => {
    if (aberto) setEtapas(estado.etapas);
    // Copia as etapas só ao abrir; edições ficam locais até salvar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const ocupacao = (id: string) => estado.familias.filter((familia) => familia.situacao !== "recusado" && familia.etapaId === id).length;
  const alterar = (id: string, campo: Partial<Etapa>) => setEtapas((atual) => atual.map((etapa) => (etapa.id === id ? { ...etapa, ...campo } : etapa)));
  const valido = etapas.every((etapa) => etapa.titulo.trim());

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= etapas.length) return;
    setEtapas((atual) => {
      const copia = [...atual];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Editar esteira"
      descricao="Renomeie, reordene, mude a cor ou crie etapas. As colunas do quadro seguem esta ordem."
      aoFechar={aoFechar}
      largura="max-w-2xl"
      rodape={
        <>
          <button type="button" onClick={aoFechar} className="ns-btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valido}
            onClick={() => {
              salvarEtapas(etapas.map((etapa) => ({ ...etapa, titulo: etapa.titulo.trim(), descricao: etapa.descricao.trim() })));
              aoFechar();
            }}
            className="ns-btn-primary"
          >
            Salvar esteira
          </button>
        </>
      }
    >
      <ol className="space-y-3">
        {etapas.map((etapa, indice) => {
          const familias = ocupacao(etapa.id);
          const bloqueada = etapa.papel !== null || familias > 0;
          return (
            <li key={etapa.id} className="rounded-xl border border-[var(--ns-border)] p-3">
              <div className="flex items-start gap-2">
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" onClick={() => mover(indice, -1)} disabled={indice === 0} aria-label={`Subir etapa ${etapa.titulo}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ns-border)] text-[var(--ns-text)] disabled:opacity-35">
                    <ArrowUp aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => mover(indice, 1)} disabled={indice === etapas.length - 1} aria-label={`Descer etapa ${etapa.titulo}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ns-border)] text-[var(--ns-text)] disabled:opacity-35">
                    <ArrowDown aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <label htmlFor={`titulo-${etapa.id}`} className="sr-only">
                      Nome da etapa {indice + 1}
                    </label>
                    <input id={`titulo-${etapa.id}`} value={etapa.titulo} onChange={(evento) => alterar(etapa.id, { titulo: evento.target.value })} placeholder="Nome da etapa" className="ns-input font-semibold" />
                  </div>
                  <div>
                    <label htmlFor={`descricao-${etapa.id}`} className="sr-only">
                      Descrição da etapa {indice + 1}
                    </label>
                    <input id={`descricao-${etapa.id}`} value={etapa.descricao} onChange={(evento) => alterar(etapa.id, { descricao: evento.target.value })} placeholder="Descrição (aparece para a equipe)" className="ns-input" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={`Cor da etapa ${etapa.titulo}`}>
                    {CORES_SUGERIDAS.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        role="radio"
                        aria-checked={etapa.cor === cor}
                        aria-label={`Cor ${cor}`}
                        onClick={() => alterar(etapa.id, { cor })}
                        className={`h-7 w-7 rounded-full border-2 ${etapa.cor === cor ? "border-[var(--ns-text)]" : "border-transparent"}`}
                        style={{ background: cor }}
                      />
                    ))}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-[var(--ns-text-secondary)]">
                    {etapa.papel && <Lock aria-hidden="true" className="h-3 w-3 shrink-0" />}
                    {etapa.papel ? ROTULO_PAPEL[etapa.papel] : familias > 0 ? `${familias} ${familias === 1 ? "família está" : "famílias estão"} nesta etapa.` : "Etapa vazia."}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={bloqueada}
                  onClick={() => setEtapas((atual) => atual.filter((item) => item.id !== etapa.id))}
                  aria-label={`Excluir etapa ${etapa.titulo}`}
                  title={etapa.papel ? "Etapa do sistema: pode renomear, mas não excluir" : familias > 0 ? "Mova as famílias antes de excluir" : "Excluir etapa"}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ns-danger)] hover:bg-[color-mix(in_srgb,var(--ns-danger)_10%,transparent)] disabled:text-[var(--ns-text-secondary)] disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => setEtapas((atual) => [...atual, { id: novoId("etapa"), titulo: "", descricao: "", cor: "#8B5CF6", papel: null }])}
        className="ns-btn-secondary mt-3 w-full"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Nova etapa
      </button>
      {!valido && <p className="mt-2 text-xs font-medium text-[var(--ns-danger)]">Dê um nome a todas as etapas para salvar.</p>}
    </Modal>
  );
}
