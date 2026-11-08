"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, PackageCheck, Search, Settings2, Users, X } from "lucide-react";
import { EditorEsteira } from "@/components/esteira/editor-esteira";
import { RegistrarEntrega } from "@/components/familia/registrar-entrega";
import { BarraTopo } from "@/components/shell/barra-topo";
import { ChipsDoacao } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";
import { pessoasNaFamilia, tiposPendentes, type Etapa, type Familia } from "@/lib/demo/tipos";
import { formatarData, normalizar, soDigitos, tempoDeEspera } from "@/lib/formatos";

export default function PaginaEsteira() {
  const { estado, moverEtapa } = useArmazem();
  const [busca, setBusca] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [bairro, setBairro] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [destinoLote, setDestinoLote] = useState("");
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [entregaId, setEntregaId] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const naEsteira = useMemo(() => estado.familias.filter((familia) => familia.situacao !== "recusado"), [estado.familias]);
  const bairros = useMemo(() => [...new Set(naEsteira.map((familia) => familia.endereco.bairro))].sort((a, b) => a.localeCompare(b, "pt-BR")), [naEsteira]);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    const numeros = soDigitos(busca);
    return naEsteira.filter((familia) => {
      if (tipoId && !familia.doacoesSolicitadas.includes(tipoId)) return false;
      if (bairro && familia.endereco.bairro !== bairro) return false;
      if (!termo) return true;
      return (
        normalizar(familia.responsavel.nome).includes(termo) ||
        normalizar(familia.protocolo).includes(termo) ||
        (numeros.length >= 3 && (familia.responsavel.cpf.includes(numeros) || familia.responsavel.nis.includes(numeros)))
      );
    });
  }, [naEsteira, busca, tipoId, bairro]);

  const filtrando = Boolean(busca.trim() || tipoId || bairro);
  const marcados = selecionados.filter((id) => naEsteira.some((familia) => familia.id === id));
  const familiaEntrega = estado.familias.find((familia) => familia.id === entregaId) ?? null;

  /** Mover para a etapa de conclusão com item pendente abre o registro de entrega em vez de mover direto. */
  function moverUma(familia: Familia, etapa: Etapa) {
    if (familia.etapaId === etapa.id) return;
    if (etapa.papel === "concluida" && tiposPendentes(familia).length > 0) {
      setEntregaId(familia.id);
      return;
    }
    moverEtapa([familia.id], etapa.id);
    setAviso(`${familia.responsavel.nome} movida para ${etapa.titulo}.`);
  }

  function moverLote() {
    const etapa = estado.etapas.find((item) => item.id === destinoLote);
    if (!etapa || marcados.length === 0) return;
    moverEtapa(marcados, etapa.id);
    setAviso(`${marcados.length} ${marcados.length === 1 ? "família movida" : "famílias movidas"} para ${etapa.titulo}.`);
    setSelecionados([]);
    setDestinoLote("");
  }

  return (
    <>
      <BarraTopo
        titulo="Esteira de doações"
        descricao="Em cada etapa, quem espera há mais tempo fica em cima."
        acoes={
          <button type="button" onClick={() => setEditando(true)} className="ns-btn-secondary !px-3">
            <Settings2 aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Editar esteira</span>
            <span className="sr-only sm:hidden">Editar esteira</span>
          </button>
        }
      />

      <div className="shrink-0 border-b border-[var(--ns-border)] bg-[var(--ns-surface)] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 sm:max-w-xs">
            <label htmlFor="busca-esteira" className="sr-only">
              Buscar por nome, CPF, NIS ou protocolo
            </label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ns-text-secondary)]" />
              <input id="busca-esteira" type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Nome, CPF, NIS ou protocolo" className="ns-input !pl-9" />
            </div>
          </div>
          <div className="min-w-[150px] flex-1 sm:max-w-[220px]">
            <label htmlFor="filtro-tipo" className="sr-only">
              Filtrar por tipo de doação
            </label>
            <select id="filtro-tipo" value={tipoId} onChange={(evento) => setTipoId(evento.target.value)} className="ns-input">
              <option value="">Todos os tipos de doação</option>
              {estado.tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px] flex-1 sm:max-w-[200px]">
            <label htmlFor="filtro-bairro" className="sr-only">
              Filtrar por bairro
            </label>
            <select id="filtro-bairro" value={bairro} onChange={(evento) => setBairro(evento.target.value)} className="ns-input">
              <option value="">Todos os bairros</option>
              {bairros.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
          {filtrando && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setTipoId("");
                setBairro("");
              }}
              className="ns-btn-secondary !px-3"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Limpar
            </button>
          )}
          <p className="ml-auto text-sm text-[var(--ns-text-secondary)]" aria-live="polite">
            {filtrando ? `${filtradas.length} de ${naEsteira.length} famílias` : `${naEsteira.length} famílias`}
          </p>
        </div>

        {marcados.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--ns-primary)] bg-[color-mix(in_srgb,var(--ns-primary)_7%,var(--ns-surface))] px-3 py-2">
            <span className="text-sm font-semibold text-[var(--ns-text)]">
              {marcados.length} {marcados.length === 1 ? "selecionada" : "selecionadas"}
            </span>
            <label htmlFor="destino-lote" className="sr-only">
              Etapa de destino
            </label>
            <select id="destino-lote" value={destinoLote} onChange={(evento) => setDestinoLote(evento.target.value)} className="ns-input !w-auto min-w-[180px] flex-1 sm:flex-none">
              <option value="">Mover para…</option>
              {estado.etapas.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.titulo}
                </option>
              ))}
            </select>
            <button type="button" disabled={!destinoLote} onClick={moverLote} className="ns-btn-primary">
              Mover
            </button>
            <button type="button" onClick={() => setSelecionados([])} className="ns-btn-secondary">
              Desmarcar
            </button>
          </div>
        )}
        <p role="status" aria-live="polite" className={aviso ? "mt-2 text-sm font-medium text-[var(--ns-success)]" : "sr-only"}>
          {aviso}
        </p>
      </div>

      <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <div className="flex h-full min-w-max snap-x snap-mandatory gap-3 sm:snap-none">
          {estado.etapas.map((etapa) => {
            // Mais antigo em cima, mais novo embaixo: a posição na coluna é a posição na fila.
            const daEtapa = filtradas.filter((familia) => familia.etapaId === etapa.id).sort((a, b) => a.entrouNaEtapaEm.localeCompare(b.entrouNaEtapaEm));
            const idsDaEtapa = daEtapa.map((familia) => familia.id);
            const todosMarcados = idsDaEtapa.length > 0 && idsDaEtapa.every((id) => marcados.includes(id));
            return (
              <section
                key={etapa.id}
                aria-label={`${etapa.titulo}, ${daEtapa.length} famílias`}
                onDragOver={(evento) => {
                  evento.preventDefault();
                  if (arrastandoId) setAlvo(etapa.id);
                }}
                onDragLeave={() => alvo === etapa.id && setAlvo(null)}
                onDrop={() => {
                  const familia = estado.familias.find((item) => item.id === arrastandoId);
                  if (familia) moverUma(familia, etapa);
                  setArrastandoId(null);
                  setAlvo(null);
                }}
                className={`flex max-h-full w-[86vw] max-w-[330px] flex-none snap-center flex-col rounded-xl border transition-colors sm:w-[330px] ${
                  alvo === etapa.id ? "border-[var(--ns-primary)] bg-[color-mix(in_srgb,var(--ns-primary)_8%,var(--ns-surface))]" : "border-[var(--ns-border)] bg-[var(--ns-surface)]"
                }`}
              >
                <header className="shrink-0 border-b border-[var(--ns-border)] px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: etapa.cor }} />
                      <h2 className="truncate text-sm font-semibold text-[var(--ns-text)]" title={etapa.descricao}>
                        {etapa.titulo}
                      </h2>
                    </div>
                    <span className="rounded-full bg-[var(--ns-surface-alt)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--ns-text)]">{daEtapa.length}</span>
                  </div>
                  {daEtapa.length > 0 && (
                    <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-[var(--ns-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={todosMarcados}
                        onChange={() => setSelecionados((atual) => (todosMarcados ? atual.filter((id) => !idsDaEtapa.includes(id)) : [...new Set([...atual, ...idsDaEtapa])]))}
                        className="h-4 w-4 accent-[var(--ns-primary)]"
                      />
                      Selecionar a coluna
                    </label>
                  )}
                </header>

                <div className="min-h-[160px] flex-1 space-y-2 overflow-y-auto p-2.5">
                  {daEtapa.length === 0 ? (
                    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-4 text-center text-xs text-[var(--ns-text-secondary)]">
                      <Inbox aria-hidden="true" className="h-5 w-5" />
                      {filtrando ? "Nenhuma família com esse filtro." : "Nenhuma família nesta etapa."}
                    </div>
                  ) : (
                    daEtapa.map((familia, posicao) => {
                      const marcado = marcados.includes(familia.id);
                      return (
                        <article
                          key={familia.id}
                          draggable
                          onDragStart={() => setArrastandoId(familia.id)}
                          onDragEnd={() => {
                            setArrastandoId(null);
                            setAlvo(null);
                          }}
                          className={`rounded-[10px] border p-3 transition-colors ${
                            arrastandoId === familia.id
                              ? "cursor-grabbing border-[var(--ns-primary)] opacity-60"
                              : marcado
                                ? "cursor-grab border-[var(--ns-primary)] bg-[color-mix(in_srgb,var(--ns-primary)_6%,var(--ns-surface-alt))]"
                                : "cursor-grab border-[var(--ns-border)] bg-[var(--ns-surface-alt)]"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={marcado}
                              onChange={() => setSelecionados((atual) => (marcado ? atual.filter((id) => id !== familia.id) : [...atual, familia.id]))}
                              aria-label={`Selecionar ${familia.responsavel.nome}`}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ns-primary)]"
                            />
                            <div className="min-w-0 flex-1">
                              <Link href={`/familias/${familia.id}`} className="block truncate text-sm font-semibold text-[var(--ns-text)] underline-offset-2 hover:underline">
                                {familia.responsavel.nome}
                              </Link>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--ns-text-secondary)]">
                                <Users aria-hidden="true" className="h-3 w-3 shrink-0" />
                                {pessoasNaFamilia(familia)} · {familia.endereco.bairro}
                              </p>
                            </div>
                            <span className="shrink-0 text-right text-[11px] leading-tight text-[var(--ns-text-secondary)]" title={`Nesta etapa desde ${formatarData(familia.entrouNaEtapaEm)}`}>
                              {!filtrando && <span className="block font-semibold tabular-nums text-[var(--ns-text)]">{posicao + 1}º</span>}
                              {tempoDeEspera(familia.entrouNaEtapaEm)}
                            </span>
                          </div>

                          <div className="mt-2.5">
                            <ChipsDoacao familia={familia} tipos={estado.tipos} compacto />
                          </div>

                          <div className="mt-3 flex items-center gap-2 border-t border-[var(--ns-border)] pt-2.5">
                            <label htmlFor={`mover-${familia.id}`} className="sr-only">
                              Mover {familia.responsavel.nome} para outra etapa
                            </label>
                            <select
                              id={`mover-${familia.id}`}
                              value={familia.etapaId}
                              onChange={(evento) => {
                                const destino = estado.etapas.find((item) => item.id === evento.target.value);
                                if (destino) moverUma(familia, destino);
                              }}
                              className="ns-input min-w-0 flex-1 !py-1.5 !text-xs"
                            >
                              {estado.etapas.map((opcao) => (
                                <option key={opcao.id} value={opcao.id}>
                                  {opcao.id === familia.etapaId ? `Em: ${opcao.titulo}` : `Mover para: ${opcao.titulo}`}
                                </option>
                              ))}
                            </select>
                            {familia.situacao === "aprovado" && (
                              <button
                                type="button"
                                onClick={() => setEntregaId(familia.id)}
                                title="Registrar entrega"
                                aria-label={`Registrar entrega para ${familia.responsavel.nome}`}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--ns-border)] bg-[var(--ns-surface)] text-[var(--ns-success)] hover:bg-[var(--ns-surface-hover)]"
                              >
                                <PackageCheck aria-hidden="true" className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <RegistrarEntrega familia={familiaEntrega} aoFechar={() => setEntregaId(null)} />
      <EditorEsteira aberto={editando} aoFechar={() => setEditando(false)} />
    </>
  );
}
