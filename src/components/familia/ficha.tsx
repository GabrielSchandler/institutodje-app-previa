"use client";

// Blocos da ficha da família. Os mesmos blocos servem a área da família e a ficha do administrador.

import { Check, FileCheck2, FileWarning, PackageCheck, PackageOpen } from "lucide-react";
import { Campo } from "@/components/ui/pecas";
import { DOCUMENTOS, VALOR_TAXA, rotuloParentesco, tiposPendentes, type Etapa, type Familia, type TipoDoacao } from "@/lib/demo/tipos";
import { formatarCep, formatarCpf, formatarData, formatarDataHora, formatarMoeda, formatarNis, formatarTelefone, idade } from "@/lib/formatos";

export function Secao({ titulo, acao, children, className = "" }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`ns-card p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--ns-text)]">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Linha do andamento: as etapas da esteira, com a atual em destaque. */
export function LinhaAndamento({ familia, etapas }: { familia: Familia; etapas: Etapa[] }) {
  const atual = Math.max(0, etapas.findIndex((etapa) => etapa.id === familia.etapaId));
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:gap-2">
      {etapas.map((etapa, indice) => {
        const feita = indice < atual;
        const ativa = indice === atual;
        return (
          <li key={etapa.id} className="flex flex-1 items-start gap-3 sm:flex-col sm:gap-2" aria-current={ativa ? "step" : undefined}>
            <div className="flex flex-col items-center self-stretch sm:w-full sm:flex-row">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  feita
                    ? "border-[var(--ns-success)] bg-[var(--ns-success)] text-white"
                    : ativa
                      ? "border-[var(--ns-primary)] bg-[var(--ns-primary)] text-white"
                      : "border-[var(--ns-border)] bg-[var(--ns-surface)] text-[var(--ns-text-secondary)]"
                }`}
              >
                {feita ? <Check aria-hidden="true" className="h-4 w-4" /> : indice + 1}
              </span>
              {indice < etapas.length - 1 && (
                <span aria-hidden="true" className={`my-1 w-0.5 flex-1 sm:mx-2 sm:my-0 sm:h-0.5 sm:w-auto ${feita ? "bg-[var(--ns-success)]" : "bg-[var(--ns-border)]"}`} />
              )}
            </div>
            <div className="pb-4 sm:pb-0">
              <p className={`text-sm font-semibold ${ativa ? "text-[var(--ns-text)]" : "text-[var(--ns-text-secondary)]"}`}>{etapa.titulo}</p>
              {ativa && <p className="mt-0.5 text-xs text-[var(--ns-text-secondary)]">Desde {formatarData(familia.entrouNaEtapaEm)}</p>}
              <span className="sr-only">{feita ? " (concluída)" : ativa ? " (etapa atual)" : " (ainda não chegou)"}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function BlocoDados({ familia, acao }: { familia: Familia; acao?: React.ReactNode }) {
  const { responsavel, endereco } = familia;
  const anos = idade(responsavel.nascimento);
  return (
    <Secao titulo="Dados do responsável" acao={acao}>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        <Campo rotulo="Nome completo">{responsavel.nome}</Campo>
        <Campo rotulo="CPF">{formatarCpf(responsavel.cpf)}</Campo>
        <Campo rotulo="RG">{responsavel.rg}</Campo>
        <Campo rotulo="Nascimento">
          {formatarData(responsavel.nascimento)}
          {anos !== null && <span className="font-normal text-[var(--ns-text-secondary)]"> · {anos} anos</span>}
        </Campo>
        <Campo rotulo="Telefone">{formatarTelefone(responsavel.telefone)}</Campo>
        <Campo rotulo="E-mail">{responsavel.email}</Campo>
        <Campo rotulo="NIS (CadÚnico)">{formatarNis(responsavel.nis)}</Campo>
        <Campo rotulo="Renda mensal da família">{formatarMoeda(responsavel.rendaMensal)}</Campo>
        <Campo rotulo="Endereço">
          {endereco.logradouro}
          {endereco.numero && `, ${endereco.numero}`}
          {endereco.complemento && ` · ${endereco.complemento}`}
          <br />
          {endereco.bairro} · {endereco.cidade}/{endereco.uf}
          {endereco.cep && ` · ${formatarCep(endereco.cep)}`}
        </Campo>
      </dl>
    </Secao>
  );
}

export function BlocoFamiliares({ familia, acao }: { familia: Familia; acao?: React.ReactNode }) {
  return (
    <Secao titulo={`Familiares (${familia.familiares.length})`} acao={acao}>
      {familia.familiares.length === 0 ? (
        <p className="text-sm text-[var(--ns-text-secondary)]">Nenhum familiar informado.</p>
      ) : (
        <ul className="divide-y divide-[var(--ns-border)]">
          {familia.familiares.map((familiar) => {
            const anos = idade(familiar.nascimento);
            return (
              <li key={familiar.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--ns-text)]">{familiar.nome}</p>
                  <p className="text-xs text-[var(--ns-text-secondary)]">
                    {rotuloParentesco(familiar.parentesco)}
                    {anos !== null && ` · ${anos} ${anos === 1 ? "ano" : "anos"}`}
                    {familiar.cpf && ` · CPF ${formatarCpf(familiar.cpf)}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Secao>
  );
}

/** O que a família pediu, o que já recebeu e o que falta. É o controle central do sistema. */
export function BlocoDoacoes({ familia, tipos, acao }: { familia: Familia; tipos: TipoDoacao[]; acao?: React.ReactNode }) {
  const nome = (id: string) => tipos.find((tipo) => tipo.id === id)?.nome ?? "Item removido";
  const pendentes = tiposPendentes(familia);
  const entregas = [...familia.entregas].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <Secao titulo="Doações" acao={acao}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ns-text)]">
            <PackageOpen aria-hidden="true" className="h-4 w-4 text-[var(--ns-warning)]" />
            Aguardando ({pendentes.length})
          </h3>
          {pendentes.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">{familia.doacoesSolicitadas.length ? "Tudo o que foi pedido já foi entregue." : "Nenhum item pedido."}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {pendentes.map((tipoId) => (
                <li key={tipoId} className="rounded-lg border border-[var(--ns-border)] px-3 py-2 text-sm font-medium text-[var(--ns-text)]">
                  {nome(tipoId)}
                </li>
              ))}
            </ul>
          )}
          {familia.observacaoNecessidade && (
            <p className="mt-3 text-sm text-[var(--ns-text-secondary)]">
              <span className="font-semibold text-[var(--ns-text)]">Observação da família:</span> {familia.observacaoNecessidade}
            </p>
          )}
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ns-text)]">
            <PackageCheck aria-hidden="true" className="h-4 w-4 text-[var(--ns-success)]" />
            Recebidas ({entregas.length})
          </h3>
          {entregas.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">Nenhuma doação recebida até agora.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {entregas.map((entrega) => (
                <li key={entrega.id} className="rounded-lg border border-[color-mix(in_srgb,var(--ns-success)_30%,var(--ns-border))] bg-[color-mix(in_srgb,var(--ns-success)_6%,transparent)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--ns-text)]">
                    {nome(entrega.tipoId)}
                    {entrega.quantidade > 1 && ` × ${entrega.quantidade}`}
                  </p>
                  <p className="text-xs text-[var(--ns-text-secondary)]">
                    {formatarData(entrega.data)} · entregue por {entrega.entreguePor}
                    {entrega.observacao && ` · ${entrega.observacao}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Secao>
  );
}

export function BlocoDocumentos({ familia }: { familia: Familia }) {
  return (
    <Secao titulo="Documentos">
      <ul className="grid gap-2 sm:grid-cols-2">
        {DOCUMENTOS.map((doc) => {
          const enviado = familia.documentos.find((item) => item.tipo === doc.tipo);
          return (
            <li key={doc.tipo} className="flex items-center gap-3 rounded-lg border border-[var(--ns-border)] px-3 py-2">
              {enviado ? (
                <FileCheck2 aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--ns-success)]" />
              ) : (
                <FileWarning aria-hidden="true" className={`h-5 w-5 shrink-0 ${doc.obrigatorio ? "text-[var(--ns-warning)]" : "text-[var(--ns-text-secondary)]"}`} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--ns-text)]">{doc.rotulo}</p>
                <p className="truncate text-xs text-[var(--ns-text-secondary)]">
                  {enviado ? `Enviado em ${formatarData(enviado.enviadoEm)}` : doc.obrigatorio ? "Não enviado" : "Opcional, não enviado"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}

const ROTULO_FORMA = { pix: "Pix", cartao: "Cartão de crédito", boleto: "Boleto bancário" } as const;

export function BlocoTaxa({ familia, acao }: { familia: Familia; acao?: React.ReactNode }) {
  const paga = familia.taxa.situacao === "paga";
  return (
    <Secao titulo="Taxa de adesão" acao={acao}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xl font-semibold text-[var(--ns-text)]">{formatarMoeda(VALOR_TAXA)}</p>
          <p className="mt-0.5 text-sm text-[var(--ns-text-secondary)]">
            {paga ? `Paga em ${formatarData(familia.taxa.pagaEm)}${familia.taxa.forma ? ` · ${ROTULO_FORMA[familia.taxa.forma]}` : ""}` : "Ainda não foi paga."}
          </p>
        </div>
        <span className={`ns-badge ${paga ? "ns-badge-success" : "ns-badge-warning"}`}>{paga ? "Paga" : "Pendente"}</span>
      </div>
    </Secao>
  );
}

export function BlocoHistorico({ familia }: { familia: Familia }) {
  const eventos = [...familia.historico].sort((a, b) => b.quando.localeCompare(a.quando));
  return (
    <Secao titulo="Histórico">
      <ol className="space-y-3">
        {eventos.map((evento) => (
          <li key={evento.id} className="border-l-2 border-[var(--ns-border)] pl-3">
            <p className="text-sm text-[var(--ns-text)]">{evento.texto}</p>
            <p className="text-xs text-[var(--ns-text-secondary)]">
              {formatarDataHora(evento.quando)} · {evento.autor}
            </p>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
