"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useArmazem } from "@/lib/demo/armazem";
import { tiposPendentes, type Familia } from "@/lib/demo/tipos";

/** Registra o que foi entregue à família. Pode concluir (mover para a etapa "Doação recebida") no mesmo passo. */
export function RegistrarEntrega({ familia, aoFechar }: { familia: Familia | null; aoFechar: () => void }) {
  const { estado, registrarEntrega } = useArmazem();
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [observacao, setObservacao] = useState("");
  const [concluir, setConcluir] = useState(true);
  const [concluirMexido, setConcluirMexido] = useState(false);

  const pendentes = familia ? tiposPendentes(familia) : [];
  const idFamilia = familia?.id;

  // Ao abrir, já vem marcado o que a família está esperando.
  useEffect(() => {
    if (!familia) return;
    setQuantidades(Object.fromEntries(tiposPendentes(familia).map((tipoId) => [tipoId, 1])));
    setObservacao("");
    setConcluirMexido(false);
    // Reinicia só quando troca a família aberta, não a cada alteração dela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFamilia]);

  const marcados = Object.keys(quantidades);
  const restam = pendentes.filter((tipoId) => !marcados.includes(tipoId)).length;

  // Sugere concluir só quando esta entrega zera a lista de pendências.
  useEffect(() => {
    if (!concluirMexido) setConcluir(restam === 0);
  }, [restam, concluirMexido]);

  if (!familia) return null;

  const etapaConcluida = estado.etapas.find((etapa) => etapa.papel === "concluida");
  const jaConcluida = familia.etapaId === etapaConcluida?.id;
  // Pedidos da família primeiro; depois os demais itens ativos (entrega extra, fora do pedido).
  const opcoes = [
    ...estado.tipos.filter((tipo) => familia.doacoesSolicitadas.includes(tipo.id)),
    ...estado.tipos.filter((tipo) => tipo.ativo && !familia.doacoesSolicitadas.includes(tipo.id)),
  ];

  function alternar(tipoId: string) {
    setQuantidades((atual) => {
      if (tipoId in atual) {
        const { [tipoId]: _removido, ...resto } = atual;
        void _removido;
        return resto;
      }
      return { ...atual, [tipoId]: 1 };
    });
  }

  function confirmar() {
    if (!familia || marcados.length === 0) return;
    registrarEntrega(
      familia.id,
      marcados.map((tipoId) => ({ tipoId, quantidade: quantidades[tipoId] })),
      observacao.trim(),
      concluir && !jaConcluida,
    );
    aoFechar();
  }

  return (
    <Modal
      aberto
      titulo="Registrar entrega"
      descricao={`${familia.responsavel.nome} · ${familia.protocolo}`}
      aoFechar={aoFechar}
      rodape={
        <>
          <button type="button" onClick={aoFechar} className="ns-btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={confirmar} disabled={marcados.length === 0} className="ns-btn-success">
            Registrar entrega
          </button>
        </>
      }
    >
      <fieldset>
        <legend className="ns-label">O que foi entregue?</legend>
        <ul className="space-y-2">
          {opcoes.map((tipo) => {
            const marcado = tipo.id in quantidades;
            const pedido = familia.doacoesSolicitadas.includes(tipo.id);
            const jaRecebeu = pedido && !pendentes.includes(tipo.id);
            return (
              <li
                key={tipo.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${marcado ? "border-[var(--ns-primary)] bg-[color-mix(in_srgb,var(--ns-primary)_7%,var(--ns-surface))]" : "border-[var(--ns-border)]"}`}
              >
                <label className="flex min-h-[40px] min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={marcado} onChange={() => alternar(tipo.id)} className="h-5 w-5 shrink-0 accent-[var(--ns-primary)]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--ns-text)]">{tipo.nome}</span>
                    <span className="block text-xs text-[var(--ns-text-secondary)]">{jaRecebeu ? "Já recebeu antes" : pedido ? "Pedido pela família" : "Fora do pedido"}</span>
                  </span>
                </label>
                {marcado && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${tipo.nome}`}
                      disabled={quantidades[tipo.id] <= 1}
                      onClick={() => setQuantidades((atual) => ({ ...atual, [tipo.id]: Math.max(1, atual[tipo.id] - 1) }))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ns-border)] text-[var(--ns-text)] disabled:opacity-40"
                    >
                      <Minus aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums text-[var(--ns-text)]" aria-live="polite">
                      {quantidades[tipo.id]}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${tipo.nome}`}
                      onClick={() => setQuantidades((atual) => ({ ...atual, [tipo.id]: Math.min(99, atual[tipo.id] + 1) }))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ns-border)] text-[var(--ns-text)]"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label htmlFor="observacao-entrega" className="ns-label mt-4">
        Observação <span className="font-normal text-[var(--ns-text-secondary)]">(opcional)</span>
      </label>
      <textarea
        id="observacao-entrega"
        rows={2}
        value={observacao}
        onChange={(evento) => setObservacao(evento.target.value)}
        placeholder="Ex.: retirado na sede pelo filho."
        className="ns-input"
      />

      {!jaConcluida && etapaConcluida && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--ns-border)] px-3 py-3">
          <input
            type="checkbox"
            checked={concluir}
            onChange={(evento) => {
              setConcluir(evento.target.checked);
              setConcluirMexido(true);
            }}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ns-primary)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--ns-text)]">Mover para “{etapaConcluida.titulo}”</span>
            <span className="block text-xs text-[var(--ns-text-secondary)]">
              {restam === 0 ? "Com esta entrega a família recebe tudo o que pediu." : `Ainda ${restam === 1 ? "fica 1 item pendente" : `ficam ${restam} itens pendentes`}. Desmarque para manter na fila.`}
            </span>
          </span>
        </label>
      )}
    </Modal>
  );
}
