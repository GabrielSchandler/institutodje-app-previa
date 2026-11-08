"use client";

import { useMemo, useState } from "react";
import { CheckCheck, ClipboardCheck, FileWarning, Users } from "lucide-react";
import { BlocoDados, BlocoDoacoes, BlocoDocumentos, BlocoFamiliares, BlocoTaxa } from "@/components/familia/ficha";
import { BarraTopo } from "@/components/shell/barra-topo";
import { Modal } from "@/components/ui/modal";
import { ChipsDoacao, EstadoVazio } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";
import { DOCUMENTOS, pessoasNaFamilia, type Familia } from "@/lib/demo/tipos";
import { formatarCpf, formatarData, tempoDeEspera } from "@/lib/formatos";

type Aba = "pendentes" | "recusados";

function documentosFaltando(familia: Familia) {
  return DOCUMENTOS.filter((doc) => doc.obrigatorio && !familia.documentos.some((item) => item.tipo === doc.tipo)).length;
}

export default function PaginaAprovacoes() {
  const { estado, aprovar, recusar, atualizarFamilia } = useArmazem();
  const [aba, setAba] = useState<Aba>("pendentes");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [recusandoId, setRecusandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [confirmarTodos, setConfirmarTodos] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Mais antigo primeiro: quem espera há mais tempo é analisado antes.
  const pendentes = useMemo(() => estado.familias.filter((familia) => familia.situacao === "pendente").sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)), [estado.familias]);
  const recusados = useMemo(() => estado.familias.filter((familia) => familia.situacao === "recusado").sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)), [estado.familias]);
  const lista = aba === "pendentes" ? pendentes : recusados;
  const marcados = selecionados.filter((id) => pendentes.some((familia) => familia.id === id));
  const aberta = estado.familias.find((familia) => familia.id === abertaId) ?? null;
  const todosMarcados = pendentes.length > 0 && marcados.length === pendentes.length;

  function aprovarLista(ids: string[]) {
    if (ids.length === 0) return;
    aprovar(ids);
    setSelecionados([]);
    setAbertaId(null);
    setConfirmarTodos(false);
    setAviso(ids.length === 1 ? "1 cadastro aprovado e enviado para a fila de doação." : `${ids.length} cadastros aprovados e enviados para a fila de doação.`);
  }

  function confirmarRecusa() {
    if (!recusandoId || !motivo.trim()) return;
    recusar(recusandoId, motivo.trim());
    setRecusandoId(null);
    setAbertaId(null);
    setMotivo("");
    setAviso("Cadastro recusado. A família vê o motivo na área dela.");
  }

  return (
    <>
      <BarraTopo titulo="Aprovações" descricao="Cadastros novos aguardando a análise do instituto." />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filtro de cadastros" className="flex gap-1 rounded-lg bg-[var(--ns-surface-alt)] p-1 text-sm">
              {(
                [
                  ["pendentes", "Aguardando", pendentes.length],
                  ["recusados", "Recusados", recusados.length],
                ] as const
              ).map(([valor, rotulo, quantidade]) => (
                <button
                  key={valor}
                  type="button"
                  role="tab"
                  aria-selected={aba === valor}
                  onClick={() => setAba(valor)}
                  className={`min-h-[36px] rounded-md px-3 font-semibold transition ${aba === valor ? "bg-[var(--ns-surface)] text-[var(--ns-text)] shadow-sm" : "text-[var(--ns-text-secondary)] hover:text-[var(--ns-text)]"}`}
                >
                  {rotulo} <span className="tabular-nums">{quantidade}</span>
                </button>
              ))}
            </div>

            {aba === "pendentes" && pendentes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={marcados.length === 0} onClick={() => aprovarLista(marcados)} className="ns-btn-secondary">
                  Aprovar selecionados{marcados.length > 0 && ` (${marcados.length})`}
                </button>
                <button type="button" onClick={() => setConfirmarTodos(true)} className="ns-btn-success">
                  <CheckCheck aria-hidden="true" className="h-4 w-4" />
                  Aprovar todos ({pendentes.length})
                </button>
              </div>
            )}
          </div>

          <p role="status" aria-live="polite" className={aviso ? "mt-4 rounded-lg border border-[color-mix(in_srgb,var(--ns-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--ns-success)_10%,transparent)] px-3 py-2 text-sm font-medium text-[var(--ns-text)]" : "sr-only"}>
            {aviso}
          </p>

          <div className="mt-4">
            {lista.length === 0 ? (
              <EstadoVazio
                icone={ClipboardCheck}
                titulo={aba === "pendentes" ? "Nenhum cadastro aguardando" : "Nenhum cadastro recusado"}
                texto={aba === "pendentes" ? "Quando uma família concluir o cadastro, ela aparece aqui para análise." : undefined}
              />
            ) : (
              <>
                {aba === "pendentes" && (
                  <label className="mb-2 flex w-fit cursor-pointer items-center gap-2 px-1 py-1 text-sm font-semibold text-[var(--ns-text)]">
                    <input
                      type="checkbox"
                      checked={todosMarcados}
                      ref={(elemento) => {
                        if (elemento) elemento.indeterminate = marcados.length > 0 && !todosMarcados;
                      }}
                      onChange={() => setSelecionados(todosMarcados ? [] : pendentes.map((familia) => familia.id))}
                      className="h-5 w-5 accent-[var(--ns-primary)]"
                    />
                    Selecionar todos
                  </label>
                )}
                <ul className="space-y-2">
                  {lista.map((familia) => {
                    const faltando = documentosFaltando(familia);
                    const marcado = marcados.includes(familia.id);
                    return (
                      <li key={familia.id} className={`ns-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center ${marcado ? "!border-[var(--ns-primary)]" : ""}`}>
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          {aba === "pendentes" && (
                            <input
                              type="checkbox"
                              checked={marcado}
                              onChange={() => setSelecionados((atual) => (marcado ? atual.filter((id) => id !== familia.id) : [...atual, familia.id]))}
                              aria-label={`Selecionar ${familia.responsavel.nome}`}
                              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ns-primary)]"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <h2 className="text-sm font-semibold text-[var(--ns-text)]">{familia.responsavel.nome}</h2>
                              <span className="text-xs text-[var(--ns-text-secondary)]">{familia.protocolo}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--ns-text-secondary)]">
                              CPF {formatarCpf(familia.responsavel.cpf)} · {familia.endereco.bairro} · cadastrou {tempoDeEspera(familia.criadoEm)} ({formatarData(familia.criadoEm)})
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ns-text)]">
                                <Users aria-hidden="true" className="h-3.5 w-3.5 text-[var(--ns-text-secondary)]" />
                                {pessoasNaFamilia(familia)} {pessoasNaFamilia(familia) === 1 ? "pessoa" : "pessoas"}
                              </span>
                              <ChipsDoacao familia={familia} tipos={estado.tipos} compacto />
                              {faltando > 0 && (
                                <span className="ns-badge ns-badge-warning gap-1">
                                  <FileWarning aria-hidden="true" className="h-3 w-3" />
                                  {faltando === 1 ? "Falta 1 documento" : `Faltam ${faltando} documentos`}
                                </span>
                              )}
                            </div>
                            {aba === "recusados" && familia.motivoRecusa && <p className="mt-2 text-xs text-[var(--ns-danger)]">Motivo: {familia.motivoRecusa}</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => setAbertaId(familia.id)} className="ns-btn-secondary flex-1 lg:flex-none">
                            Ver ficha
                          </button>
                          {aba === "pendentes" ? (
                            <button type="button" onClick={() => aprovarLista([familia.id])} className="ns-btn-success flex-1 lg:flex-none">
                              Aprovar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                atualizarFamilia(familia.id, (atual) => ({ ...atual, situacao: "pendente", motivoRecusa: null }), "Cadastro reaberto para nova análise.");
                                setAviso("Cadastro reaberto. Ele voltou para a lista de aguardando.");
                              }}
                              className="ns-btn-secondary flex-1 lg:flex-none"
                            >
                              Reabrir análise
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </main>

      <Modal
        aberto={aberta !== null && recusandoId === null}
        titulo={aberta?.responsavel.nome ?? ""}
        descricao={aberta ? `${aberta.protocolo} · cadastrou em ${formatarData(aberta.criadoEm)}` : undefined}
        aoFechar={() => setAbertaId(null)}
        largura="max-w-3xl"
        rodape={
          aberta?.situacao === "pendente" ? (
            <>
              <button type="button" onClick={() => setRecusandoId(aberta.id)} className="ns-btn-danger">
                Recusar
              </button>
              <button type="button" onClick={() => aprovarLista([aberta.id])} className="ns-btn-success">
                Aprovar cadastro
              </button>
            </>
          ) : undefined
        }
      >
        {aberta && (
          <div className="space-y-4">
            <BlocoDados familia={aberta} />
            <BlocoFamiliares familia={aberta} />
            <BlocoDoacoes familia={aberta} tipos={estado.tipos} />
            <BlocoDocumentos familia={aberta} />
            <BlocoTaxa familia={aberta} />
          </div>
        )}
      </Modal>

      <Modal
        aberto={recusandoId !== null}
        titulo="Recusar cadastro"
        descricao="A família vê este motivo na área dela."
        aoFechar={() => setRecusandoId(null)}
        rodape={
          <>
            <button type="button" onClick={() => setRecusandoId(null)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button type="button" disabled={!motivo.trim()} onClick={confirmarRecusa} className="ns-btn-danger-solid">
              Recusar cadastro
            </button>
          </>
        }
      >
        <label htmlFor="motivo-recusa" className="ns-label">
          Motivo da recusa
        </label>
        <textarea id="motivo-recusa" rows={4} value={motivo} onChange={(evento) => setMotivo(evento.target.value)} placeholder="Ex.: o comprovante de residência está ilegível." className="ns-input" />
      </Modal>

      <Modal
        aberto={confirmarTodos}
        titulo={`Aprovar ${pendentes.length} ${pendentes.length === 1 ? "cadastro" : "cadastros"}?`}
        descricao="Todos vão para a fila de doação, na ordem em que foram aprovados."
        aoFechar={() => setConfirmarTodos(false)}
        rodape={
          <>
            <button type="button" onClick={() => setConfirmarTodos(false)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button type="button" onClick={() => aprovarLista(pendentes.map((familia) => familia.id))} className="ns-btn-success">
              Aprovar todos
            </button>
          </>
        }
      >
        {pendentes.some((familia) => documentosFaltando(familia) > 0) ? (
          <p className="text-sm text-[var(--ns-text)]">
            <strong>{pendentes.filter((familia) => documentosFaltando(familia) > 0).length}</strong> destes cadastros estão com documento faltando. Se preferir, feche e analise um a um.
          </p>
        ) : (
          <p className="text-sm text-[var(--ns-text-secondary)]">Todos os cadastros estão com a documentação obrigatória enviada.</p>
        )}
      </Modal>
    </>
  );
}
