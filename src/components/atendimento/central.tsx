"use client";

// Central de atendimento simulada (base: atendimento-workspace do newseccrm e a tela /atendimento do GRSCRM).
// Nenhuma mensagem sai de verdade: o WhatsApp e a assistente virtual são encenados com dados fictícios.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRightLeft, Bot, Check, Info, MessagesSquare, PackageCheck, RotateCcw, Search, Send, StickyNote, UserPlus, X } from "lucide-react";
import { RegistrarEntrega } from "@/components/familia/registrar-entrega";
import { Modal } from "@/components/ui/modal";
import { ChipsDoacao, SeloAndamento } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";
import { pessoasNaFamilia, tiposPendentes, type Conversa, type ConversaEstado, type Mensagem } from "@/lib/demo/tipos";
import { formatarData, formatarTelefone, horaCurta, iniciais, normalizar } from "@/lib/formatos";

type Aba = "meus" | "fila" | "ia" | "todos";

const ROTULO_ESTADO: Record<ConversaEstado, string> = {
  IA: "Assistente virtual",
  AGUARDANDO_HUMANO: "Aguardando atendente",
  HUMANO: "Em atendimento",
  ENCERRADA: "Concluída",
};

const COR_ESTADO: Record<ConversaEstado, string> = {
  IA: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  AGUARDANDO_HUMANO: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  HUMANO: "bg-[var(--ns-primary)]/15 text-[var(--ns-primary)]",
  ENCERRADA: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
};

function SeloEstado({ estado }: { estado: ConversaEstado }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${COR_ESTADO[estado]}`}>{ROTULO_ESTADO[estado]}</span>;
}

function quandoCurto(iso: string) {
  const data = new Date(iso);
  const hoje = new Date();
  return data.toDateString() === hoje.toDateString() ? horaCurta(iso) : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function Bolha({ mensagem }: { mensagem: Mensagem }) {
  if (mensagem.autor === "sistema") {
    return <p className="mx-auto max-w-md text-center text-xs text-[var(--ns-text-secondary)]">{mensagem.texto} · {horaCurta(mensagem.quando)}</p>;
  }
  if (mensagem.autor === "nota") {
    return (
      <div className="mx-auto flex max-w-md items-start gap-2 rounded-lg border border-[color-mix(in_srgb,var(--ns-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--ns-warning)_12%,transparent)] px-3 py-2 text-xs text-[var(--ns-text)]">
        <StickyNote aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ns-warning)]" />
        <div>
          <p className="font-semibold">Nota interna de {mensagem.autorNome} · a família não vê</p>
          <p className="mt-0.5">{mensagem.texto}</p>
        </div>
      </div>
    );
  }
  const doContato = mensagem.autor === "contato";
  const daIa = mensagem.autor === "ia";
  return (
    <div className={`flex ${doContato ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] ${
          doContato ? "bg-[var(--ns-surface-alt)] text-[var(--ns-text)]" : daIa ? "bg-violet-600 text-white" : "bg-[var(--ns-primary)] text-white"
        }`}
      >
        {!doContato && (
          <p className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-white/85">
            {daIa && <Bot aria-hidden="true" className="h-3 w-3" />}
            {mensagem.autorNome}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{mensagem.texto}</p>
        <p className={`mt-1 text-right text-[10px] ${doContato ? "text-[var(--ns-text-secondary)]" : "text-white/75"}`}>{horaCurta(mensagem.quando)}</p>
      </div>
    </div>
  );
}

export function CentralAtendimento() {
  const { estado, membroAtual, enviarMensagem, assumirConversa, transferirConversa, concluirConversa, reabrirConversa, marcarLida } = useArmazem();
  const [aba, setAba] = useState<Aba>("meus");
  const [busca, setBusca] = useState("");
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [comoNota, setComoNota] = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);
  const [transferindo, setTransferindo] = useState(false);
  const [destinoId, setDestinoId] = useState("");
  const [notaTransferencia, setNotaTransferencia] = useState("");
  const [entregando, setEntregando] = useState(false);
  const fimDaConversa = useRef<HTMLDivElement>(null);

  const meuId = membroAtual?.id ?? "";
  const daAba = (conversa: Conversa, qual: Aba) => {
    if (qual === "meus") return conversa.responsavelId === meuId && conversa.estado === "HUMANO";
    if (qual === "fila") return conversa.estado === "AGUARDANDO_HUMANO";
    if (qual === "ia") return conversa.estado === "IA";
    return true;
  };

  const contagens = useMemo(
    () => ({
      meus: estado.conversas.filter((conversa) => daAba(conversa, "meus")).length,
      fila: estado.conversas.filter((conversa) => daAba(conversa, "fila")).length,
      ia: estado.conversas.filter((conversa) => daAba(conversa, "ia")).length,
      todos: estado.conversas.length,
    }),
    // daAba depende só de meuId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estado.conversas, meuId],
  );

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return estado.conversas
      .filter((conversa) => daAba(conversa, aba))
      .filter((conversa) => !termo || normalizar(conversa.nome).includes(termo) || conversa.telefone.includes(termo))
      .sort((a, b) => b.ultimaAtividade.localeCompare(a.ultimaAtividade));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.conversas, aba, busca, meuId]);

  const conversa = estado.conversas.find((item) => item.id === selecionadaId) ?? null;
  const familia = conversa?.familiaId ? estado.familias.find((item) => item.id === conversa.familiaId) ?? null : null;
  const canal = estado.canais.find((item) => item.id === conversa?.canalId);
  const responsavel = estado.equipe.find((membro) => membro.id === conversa?.responsavelId);
  const rascunho = conversa ? rascunhos[conversa.id] ?? "" : "";
  const quantidadeMensagens = conversa?.mensagens.length ?? 0;

  useEffect(() => {
    if (selecionadaId) marcarLida(selecionadaId);
    setComoNota(false);
    // Só ao trocar de conversa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionadaId]);

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ block: "end" });
  }, [selecionadaId, quantidadeMensagens]);

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!conversa || !rascunho.trim()) return;
    enviarMensagem(conversa.id, rascunho.trim(), comoNota);
    setRascunhos((atual) => ({ ...atual, [conversa.id]: "" }));
  }

  const colegas = estado.equipe.filter((membro) => membro.ativo && membro.id !== conversa?.responsavelId);

  return (
    <div className="flex h-full min-h-0 w-full bg-[var(--ns-surface)]">
      {/* Lista de conversas */}
      <div className={`${conversa ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-[var(--ns-border)] md:w-[320px]`}>
        <div className="flex flex-col gap-3 border-b border-[var(--ns-border)] p-3">
          <div className="relative">
            <label htmlFor="busca-conversas" className="sr-only">
              Buscar conversas
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ns-text-secondary)]" />
            <input id="busca-conversas" type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar por nome ou telefone" className="ns-input !pl-9" />
          </div>
          <div role="tablist" aria-label="Filtro de conversas" className="flex gap-1 rounded-lg bg-[var(--ns-surface-alt)] p-1 text-xs">
            {(
              [
                ["meus", "Meus"],
                ["fila", "Fila"],
                ["ia", "IA"],
                ["todos", "Todos"],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={aba === valor}
                onClick={() => setAba(valor)}
                className={`min-h-[34px] flex-1 rounded-md px-1 font-semibold transition ${aba === valor ? "bg-[var(--ns-surface)] text-[var(--ns-text)] shadow-sm" : "text-[var(--ns-text-secondary)] hover:text-[var(--ns-text)]"}`}
              >
                {rotulo} <span className="tabular-nums">{contagens[valor]}</span>
              </button>
            ))}
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto">
          {lista.length === 0 ? (
            <li className="p-6 text-center text-sm text-[var(--ns-text-secondary)]">
              {aba === "meus" ? "Você não tem conversas em atendimento. Veja a Fila." : aba === "fila" ? "Ninguém aguardando atendente." : "Nenhuma conversa neste filtro."}
            </li>
          ) : (
            lista.map((item) => {
              const ultima = item.mensagens[item.mensagens.length - 1];
              const dono = estado.equipe.find((membro) => membro.id === item.responsavelId);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionadaId(item.id)}
                    aria-current={item.id === selecionadaId ? "true" : undefined}
                    className={`flex w-full flex-col gap-1 border-b border-[var(--ns-border)] px-3 py-3 text-left transition-colors ${
                      item.id === selecionadaId ? "bg-[color-mix(in_srgb,var(--ns-primary)_10%,transparent)]" : "hover:bg-[var(--ns-surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ns-text)]">{item.nome}</span>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--ns-text-secondary)]">{quandoCurto(item.ultimaAtividade)}</span>
                    </div>
                    <span className="truncate text-xs text-[var(--ns-text-secondary)]">{ultima?.texto}</span>
                    <div className="flex items-center gap-2">
                      <SeloEstado estado={item.estado} />
                      <span className="truncate text-[11px] text-[var(--ns-text-secondary)]">{dono ? dono.nome.split(" ")[0] : "Sem atendente"}</span>
                      {item.naoLidas > 0 && (
                        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ns-primary)] px-1 text-[11px] font-bold text-white">
                          {item.naoLidas}
                          <span className="sr-only"> não lidas</span>
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Conversa aberta */}
      {!conversa ? (
        <div className="hidden min-w-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center md:flex">
          <MessagesSquare aria-hidden="true" className="h-8 w-8 text-[var(--ns-text-secondary)]" />
          <p className="text-sm font-semibold text-[var(--ns-text)]">Escolha uma conversa</p>
          <p className="max-w-xs text-sm text-[var(--ns-text-secondary)]">A assistente virtual responde primeiro. Quando ela não resolve, a conversa vai para a Fila e qualquer pessoa da equipe pode assumir.</p>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ns-border)] px-3 py-2.5 sm:px-4">
            <button type="button" onClick={() => setSelecionadaId(null)} aria-label="Voltar para a lista" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--ns-text)] md:hidden">
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ns-primary)]/15 text-sm font-semibold text-[var(--ns-primary)] sm:flex">{iniciais(conversa.nome)}</span>
            {/* Largura mínima: sem ela os botões espremem o nome até sumir; com ela, os botões descem de linha. */}
            <div className="min-w-[170px] flex-1">
              <p className="truncate text-sm font-semibold text-[var(--ns-text)]">{conversa.nome}</p>
              <p className="truncate text-xs text-[var(--ns-text-secondary)]">
                {formatarTelefone(conversa.telefone)} · {canal?.nome} · {responsavel ? responsavel.nome : "sem atendente"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <span className="hidden lg:inline-flex">
                <SeloEstado estado={conversa.estado} />
              </span>
              {conversa.estado === "ENCERRADA" ? (
                <button type="button" onClick={() => reabrirConversa(conversa.id)} className="ns-btn-secondary !px-3 !py-2 !text-xs">
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                  Reabrir
                </button>
              ) : (
                <>
                  {conversa.responsavelId !== meuId && (
                    <button type="button" onClick={() => assumirConversa(conversa.id)} className="ns-btn-primary !px-3 !py-2 !text-xs">
                      <UserPlus aria-hidden="true" className="h-3.5 w-3.5" />
                      Assumir
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDestinoId("");
                      setNotaTransferencia("");
                      setTransferindo(true);
                    }}
                    className="ns-btn-secondary !px-3 !py-2 !text-xs"
                  >
                    <ArrowRightLeft aria-hidden="true" className="h-3.5 w-3.5" />
                    Transferir
                  </button>
                  <button type="button" onClick={() => concluirConversa(conversa.id)} className="ns-btn-secondary !px-3 !py-2 !text-xs">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    Concluir
                  </button>
                </>
              )}
              <button type="button" onClick={() => setPainelAberto(true)} aria-label="Ver cadastro da família" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ns-border)] text-[var(--ns-text)] xl:hidden">
                <Info aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[var(--ns-bg)] px-3 py-4 sm:px-4" role="log" aria-label={`Mensagens de ${conversa.nome}`}>
            {conversa.mensagens.map((mensagem) => (
              <Bolha key={mensagem.id} mensagem={mensagem} />
            ))}
            <div ref={fimDaConversa} />
          </div>

          {conversa.estado === "IA" && !comoNota && (
            <p className="flex items-center gap-2 border-t border-[var(--ns-border)] bg-[color-mix(in_srgb,#8b5cf6_10%,var(--ns-surface))] px-4 py-2 text-xs text-[var(--ns-text)]">
              <Bot aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-300" />
              A assistente virtual está respondendo. Se você enviar uma mensagem, a conversa passa para você.
            </p>
          )}

          <form onSubmit={enviar} className="flex items-end gap-2 border-t border-[var(--ns-border)] p-3">
            <button
              type="button"
              onClick={() => setComoNota((atual) => !atual)}
              aria-pressed={comoNota}
              title="Nota interna: fica só para a equipe"
              className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${
                comoNota ? "border-[var(--ns-warning)] bg-[color-mix(in_srgb,var(--ns-warning)_15%,transparent)] text-[var(--ns-text)]" : "border-[var(--ns-border)] text-[var(--ns-text-secondary)]"
              }`}
            >
              <StickyNote aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Nota</span>
              <span className="sr-only sm:hidden">Nota interna</span>
            </button>
            <label htmlFor="mensagem" className="sr-only">
              {comoNota ? "Nota interna" : "Mensagem"}
            </label>
            <textarea
              id="mensagem"
              rows={1}
              value={rascunho}
              onChange={(evento) => setRascunhos((atual) => ({ ...atual, [conversa.id]: evento.target.value }))}
              onKeyDown={(evento) => {
                if (evento.key === "Enter" && !evento.shiftKey) {
                  evento.preventDefault();
                  evento.currentTarget.form?.requestSubmit();
                }
              }}
              disabled={conversa.estado === "ENCERRADA"}
              placeholder={conversa.estado === "ENCERRADA" ? "Reabra a conversa para escrever" : comoNota ? "Nota interna (a família não vê)" : "Digite uma mensagem"}
              className="ns-input max-h-32 min-h-[44px] flex-1 resize-none disabled:opacity-60"
            />
            <button type="submit" disabled={!rascunho.trim() || conversa.estado === "ENCERRADA"} aria-label={comoNota ? "Salvar nota" : "Enviar mensagem"} className="ns-btn-primary h-11 w-11 shrink-0 !p-0">
              <Send aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Cadastro da família ao lado da conversa */}
      {conversa && (
        <aside
          aria-label="Cadastro da família"
          className={`${painelAberto ? "fixed inset-0 z-[75] flex" : "hidden"} w-full flex-col overflow-y-auto border-l border-[var(--ns-border)] bg-[var(--ns-surface)] xl:static xl:z-auto xl:flex xl:w-[320px] xl:shrink-0`}
        >
          <div className="flex items-center justify-between border-b border-[var(--ns-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--ns-text)]">Cadastro</h2>
            <button type="button" onClick={() => setPainelAberto(false)} aria-label="Fechar cadastro" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ns-text-secondary)] xl:hidden">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          {familia ? (
            <div className="space-y-4 p-4">
              <div>
                <p className="text-sm font-semibold text-[var(--ns-text)]">{familia.responsavel.nome}</p>
                <p className="text-xs text-[var(--ns-text-secondary)]">
                  {familia.protocolo} · {pessoasNaFamilia(familia)} {pessoasNaFamilia(familia) === 1 ? "pessoa" : "pessoas"} · {familia.endereco.bairro}
                </p>
                <div className="mt-2">
                  <SeloAndamento familia={familia} etapas={estado.etapas} />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-[var(--ns-text-secondary)]">
                  Pedidos · {tiposPendentes(familia).length === 0 ? "tudo entregue" : `${tiposPendentes(familia).length} aguardando`}
                </p>
                <ChipsDoacao familia={familia} tipos={estado.tipos} />
              </div>
              {familia.entregas.length > 0 && (
                <p className="text-xs text-[var(--ns-text-secondary)]">Última entrega em {formatarData([...familia.entregas].sort((a, b) => b.data.localeCompare(a.data))[0].data)}.</p>
              )}
              {familia.observacaoNecessidade && <p className="rounded-lg bg-[var(--ns-surface-alt)] px-3 py-2 text-xs text-[var(--ns-text)]">{familia.observacaoNecessidade}</p>}
              <div className="flex flex-col gap-2">
                {familia.situacao === "aprovado" && (
                  <button type="button" onClick={() => setEntregando(true)} className="ns-btn-success">
                    <PackageCheck aria-hidden="true" className="h-4 w-4" />
                    Registrar entrega
                  </button>
                )}
                <Link href={`/familias/${familia.id}`} className="ns-btn-secondary">
                  Abrir ficha completa
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              <p className="text-sm font-semibold text-[var(--ns-text)]">Número sem cadastro</p>
              <p className="text-sm text-[var(--ns-text-secondary)]">Este telefone não está em nenhuma família cadastrada. Pode ser um doador ou alguém que ainda vai se cadastrar.</p>
              <button
                type="button"
                disabled={conversa.estado === "ENCERRADA"}
                onClick={() => enviarMensagem(conversa.id, "Para se cadastrar no instituto, acesse o link e preencha os dados da sua família: https://exemplo.org/cadastro", false)}
                className="ns-btn-secondary w-full"
              >
                Enviar link de cadastro
              </button>
            </div>
          )}
        </aside>
      )}

      <Modal
        aberto={transferindo && conversa !== null}
        titulo="Transferir conversa"
        descricao="A pessoa escolhida passa a ser a responsável e vê todo o histórico."
        aoFechar={() => setTransferindo(false)}
        rodape={
          <>
            <button type="button" onClick={() => setTransferindo(false)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!destinoId}
              onClick={() => {
                if (!conversa) return;
                transferirConversa(conversa.id, destinoId, notaTransferencia.trim());
                setTransferindo(false);
              }}
              className="ns-btn-primary"
            >
              Transferir
            </button>
          </>
        }
      >
        <fieldset>
          <legend className="ns-label">Para quem?</legend>
          <ul className="space-y-1.5">
            {colegas.map((membro) => {
              const emAtendimento = estado.conversas.filter((item) => item.responsavelId === membro.id && item.estado === "HUMANO").length;
              return (
                <li key={membro.id}>
                  <label className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${destinoId === membro.id ? "border-[var(--ns-primary)] bg-[color-mix(in_srgb,var(--ns-primary)_7%,var(--ns-surface))]" : "border-[var(--ns-border)]"}`}>
                    <input type="radio" name="destino" checked={destinoId === membro.id} onChange={() => setDestinoId(membro.id)} className="h-5 w-5 accent-[var(--ns-primary)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--ns-text)]">
                        {membro.nome}
                        {membro.id === meuId && <span className="font-normal text-[var(--ns-text-secondary)]"> (você)</span>}
                      </span>
                      <span className="block text-xs capitalize text-[var(--ns-text-secondary)]">{membro.papel}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-[var(--ns-text-secondary)]">{emAtendimento} em atendimento</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <label htmlFor="nota-transferencia" className="ns-label mt-4">
          Recado para quem recebe <span className="font-normal text-[var(--ns-text-secondary)]">(opcional)</span>
        </label>
        <textarea id="nota-transferencia" rows={2} value={notaTransferencia} onChange={(evento) => setNotaTransferencia(evento.target.value)} placeholder="Ex.: família pediu cadeira de rodas, falta confirmar retirada." className="ns-input" />
      </Modal>

      <RegistrarEntrega familia={entregando ? familia : null} aoFechar={() => setEntregando(false)} />
    </div>
  );
}
