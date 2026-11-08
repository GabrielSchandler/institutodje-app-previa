"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, HandHeart, Hourglass, PackageCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Secao } from "@/components/familia/ficha";
import { BarraTopo } from "@/components/shell/barra-topo";
import { useArmazem } from "@/lib/demo/armazem";
import { VALOR_TAXA, pessoasNaFamilia, tiposPendentes } from "@/lib/demo/tipos";
import { diasDesde, formatarMoeda, tempoDeEspera } from "@/lib/formatos";

function Indicador({ icone: Icone, rotulo, valor, detalhe, href, cor = "var(--ns-primary)" }: { icone: LucideIcon; rotulo: string; valor: string; detalhe?: string; href?: string; cor?: string }) {
  const conteudo = (
    <>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${cor} 14%, transparent)`, color: cor }}>
          <Icone aria-hidden="true" className="h-4 w-4" />
        </span>
        <p className="text-xs font-semibold text-[var(--ns-text-secondary)]">{rotulo}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums leading-none text-[var(--ns-text)]">{valor}</p>
      {detalhe && <p className="mt-1.5 text-xs text-[var(--ns-text-secondary)]">{detalhe}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="ns-card block p-4 transition-colors hover:border-[var(--ns-primary)]">
      {conteudo}
    </Link>
  ) : (
    <div className="ns-card p-4">{conteudo}</div>
  );
}

export default function PaginaPainel() {
  const { estado } = useArmazem();

  const dados = useMemo(() => {
    const agora = Date.now();
    const etapaFila = estado.etapas.find((etapa) => etapa.papel === "fila");
    const ativas = estado.familias.filter((familia) => familia.situacao !== "recusado");
    const aprovadas = estado.familias.filter((familia) => familia.situacao === "aprovado");
    const pendentes = estado.familias.filter((familia) => familia.situacao === "pendente");
    const receberam = aprovadas.filter((familia) => familia.entregas.length > 0);
    const naoReceberam = aprovadas.filter((familia) => familia.entregas.length === 0);
    const naFila = aprovadas.filter((familia) => familia.etapaId === etapaFila?.id).sort((a, b) => a.entrouNaEtapaEm.localeCompare(b.entrouNaEtapaEm));
    const esperaMedia = naFila.length ? Math.round(naFila.reduce((total, familia) => total + diasDesde(familia.entrouNaEtapaEm, agora), 0) / naFila.length) : 0;

    const demanda = estado.tipos
      .map((tipo) => {
        const pediram = aprovadas.filter((familia) => familia.doacoesSolicitadas.includes(tipo.id));
        const aguardando = pediram.filter((familia) => tiposPendentes(familia).includes(tipo.id)).length;
        return { id: tipo.id, nome: tipo.nome, pediram: pediram.length, aguardando, entregues: pediram.length - aguardando };
      })
      .filter((item) => item.pediram > 0)
      .sort((a, b) => b.aguardando - a.aguardando || b.pediram - a.pediram);

    // Entregas dos últimos 6 meses, do mais antigo para o atual.
    const meses = Array.from({ length: 6 }, (_, indice) => {
      const data = new Date(agora);
      data.setDate(1);
      data.setMonth(data.getMonth() - (5 - indice));
      return { chave: `${data.getFullYear()}-${data.getMonth()}`, rotulo: data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), total: 0 };
    });
    estado.familias.forEach((familia) =>
      familia.entregas.forEach((entrega) => {
        const data = new Date(entrega.data);
        const mes = meses.find((item) => item.chave === `${data.getFullYear()}-${data.getMonth()}`);
        if (mes) mes.total += entrega.quantidade;
      }),
    );

    const taxasPagas = ativas.filter((familia) => familia.taxa.situacao === "paga").length;

    return {
      ativas,
      aprovadas,
      pendentes,
      receberam,
      naoReceberam,
      naFila,
      esperaMedia,
      demanda,
      meses,
      taxasPagas,
      pessoas: aprovadas.reduce((total, familia) => total + pessoasNaFamilia(familia), 0),
      conversasNaFila: estado.conversas.filter((conversa) => conversa.estado === "AGUARDANDO_HUMANO").length,
    };
  }, [estado]);

  const maiorDemanda = Math.max(1, ...dados.demanda.map((item) => item.pediram));
  const maiorMes = Math.max(1, ...dados.meses.map((mes) => mes.total));
  const totalAprovadas = Math.max(1, dados.aprovadas.length);
  const percentualRecebeu = Math.round((dados.receberam.length / totalAprovadas) * 100);

  return (
    <>
      <BarraTopo titulo="Painel" descricao="Visão geral dos cadastros e das doações." />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador icone={Users} rotulo="Famílias cadastradas" valor={String(dados.ativas.length)} detalhe={`${dados.pessoas} pessoas nas famílias aprovadas`} href="/familias" />
            <Indicador
              icone={ClipboardCheck}
              rotulo="Aguardando aprovação"
              valor={String(dados.pendentes.length)}
              detalhe={dados.pendentes.length ? "Cadastros novos para analisar" : "Nenhum cadastro parado"}
              href="/aprovacoes"
              cor="var(--ns-warning)"
            />
            <Indicador icone={Hourglass} rotulo="Na fila de doação" valor={String(dados.naFila.length)} detalhe={dados.naFila.length ? `Espera média de ${dados.esperaMedia} dias` : "Fila vazia"} href="/esteira" />
            <Indicador icone={PackageCheck} rotulo="Já receberam" valor={String(dados.receberam.length)} detalhe={`${percentualRecebeu}% das famílias aprovadas`} href="/familias" cor="var(--ns-success)" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Secao titulo="Quem recebeu e quem não recebeu">
              <p className="-mt-2 mb-4 text-sm text-[var(--ns-text-secondary)]">Entre as {dados.aprovadas.length} famílias aprovadas.</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-[var(--ns-surface-alt)]" role="img" aria-label={`${dados.receberam.length} famílias já receberam alguma doação e ${dados.naoReceberam.length} ainda não receberam nada`}>
                <div className="bg-[var(--ns-success)]" style={{ width: `${percentualRecebeu}%` }} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="flex items-center gap-2 text-sm text-[var(--ns-text-secondary)]">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[var(--ns-success)]" />
                    Já receberam
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ns-text)]">{dados.receberam.length}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-sm text-[var(--ns-text-secondary)]">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border border-[var(--ns-border)] bg-[var(--ns-surface-alt)]" />
                    Ainda não receberam nada
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ns-text)]">{dados.naoReceberam.length}</dd>
                </div>
              </dl>
            </Secao>

            <Secao
              titulo="Há mais tempo na fila"
              acao={
                <Link href="/esteira" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--ns-primary)] underline-offset-4 hover:underline">
                  Ver esteira
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {dados.naFila.length === 0 ? (
                <p className="text-sm text-[var(--ns-text-secondary)]">Nenhuma família aguardando doação.</p>
              ) : (
                <ol className="divide-y divide-[var(--ns-border)]">
                  {dados.naFila.slice(0, 5).map((familia, indice) => (
                    <li key={familia.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="w-5 shrink-0 text-sm font-semibold tabular-nums text-[var(--ns-text-secondary)]">{indice + 1}º</span>
                      <Link href={`/familias/${familia.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ns-text)] underline-offset-2 hover:underline">
                        {familia.responsavel.nome}
                      </Link>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--ns-text-secondary)]">{tempoDeEspera(familia.entrouNaEtapaEm)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Secao>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Secao titulo="Demanda por tipo de doação">
              <p className="-mt-2 mb-4 text-sm text-[var(--ns-text-secondary)]">O que as famílias aprovadas pediram. A parte escura é o que ainda falta entregar.</p>
              {dados.demanda.length === 0 ? (
                <p className="text-sm text-[var(--ns-text-secondary)]">Nenhum pedido registrado.</p>
              ) : (
                <ul className="space-y-3">
                  {dados.demanda.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-[var(--ns-text)]">{item.nome}</span>
                        <span className="shrink-0 tabular-nums text-[var(--ns-text-secondary)]">
                          <strong className="font-semibold text-[var(--ns-text)]">{item.aguardando}</strong> aguardando · {item.entregues} {item.entregues === 1 ? "entregue" : "entregues"}
                        </span>
                      </div>
                      <div className="mt-1.5 flex h-2.5 gap-0.5" aria-hidden="true">
                        {item.aguardando > 0 && <div className="rounded-sm bg-[var(--ns-primary)]" style={{ width: `${(item.aguardando / maiorDemanda) * 100}%` }} />}
                        {item.entregues > 0 && <div className="rounded-sm bg-[color-mix(in_srgb,var(--ns-primary)_28%,var(--ns-surface-alt))]" style={{ width: `${(item.entregues / maiorDemanda) * 100}%` }} />}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Secao>

            <Secao titulo="Entregas por mês">
              <p className="-mt-2 mb-4 text-sm text-[var(--ns-text-secondary)]">Itens entregues nos últimos seis meses.</p>
              <ol className="flex h-44 items-end gap-2">
                {dados.meses.map((mes) => (
                  <li key={mes.chave} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-xs font-semibold tabular-nums text-[var(--ns-text)]">{mes.total}</span>
                    <div aria-hidden="true" className="w-full max-w-[44px] rounded-t-md bg-[var(--ns-primary)]" style={{ height: `${Math.max(2, (mes.total / maiorMes) * 100)}%`, opacity: mes.total ? 1 : 0.25 }} />
                    <span className="text-xs capitalize text-[var(--ns-text-secondary)]">
                      {mes.rotulo}
                      <span className="sr-only">: {mes.total} itens</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Secao>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Indicador
              icone={HandHeart}
              rotulo="Taxa de adesão"
              valor={formatarMoeda(dados.taxasPagas * VALOR_TAXA)}
              detalhe={`${dados.taxasPagas} pagas · ${dados.ativas.length - dados.taxasPagas} pendentes`}
              cor="var(--ns-success)"
            />
            <Indicador
              icone={Hourglass}
              rotulo="Atendimento no WhatsApp"
              valor={String(dados.conversasNaFila)}
              detalhe={dados.conversasNaFila === 1 ? "Conversa aguardando atendente" : "Conversas aguardando atendente"}
              href="/atendimento"
              cor="var(--ns-warning)"
            />
          </div>
        </div>
      </main>
    </>
  );
}
