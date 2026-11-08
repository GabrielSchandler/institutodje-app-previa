"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, PackageCheck, Pencil, UserX } from "lucide-react";
import { EditorFamiliares } from "@/components/familia/editor-familiares";
import { BlocoDados, BlocoDoacoes, BlocoDocumentos, BlocoFamiliares, BlocoHistorico, BlocoTaxa, LinhaAndamento, Secao } from "@/components/familia/ficha";
import { RegistrarEntrega } from "@/components/familia/registrar-entrega";
import { BarraTopo } from "@/components/shell/barra-topo";
import { CampoTexto } from "@/components/ui/formulario";
import { Modal } from "@/components/ui/modal";
import { EstadoVazio, SeloSituacao } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";
import type { Endereco, Familiar, Responsavel } from "@/lib/demo/tipos";
import { formatarCpf, formatarNis, formatarTelefone, soDigitos } from "@/lib/formatos";

type Edicao = { responsavel: Responsavel; endereco: Endereco; renda: string; pedidos: string[]; observacao: string };

export default function PaginaFicha() {
  const { id } = useParams<{ id: string }>();
  const { estado, aprovar, atualizarFamilia, moverEtapa } = useArmazem();
  const familia = estado.familias.find((item) => item.id === id);
  const [entregando, setEntregando] = useState(false);
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [familiares, setFamiliares] = useState<Familiar[] | null>(null);

  if (!familia) {
    return (
      <>
        <BarraTopo titulo="Família não encontrada" />
        <main className="flex-1 p-6">
          <EstadoVazio icone={UserX} titulo="Este cadastro não existe mais" texto="Ele pode ter sido removido ao restaurar os dados de demonstração.">
            <Link href="/familias" className="ns-btn-primary">
              Ver todas as famílias
            </Link>
          </EstadoVazio>
        </main>
      </>
    );
  }

  const mudarResponsavel = (campo: Partial<Responsavel>) => setEdicao((atual) => (atual ? { ...atual, responsavel: { ...atual.responsavel, ...campo } } : atual));
  const mudarEndereco = (campo: Partial<Endereco>) => setEdicao((atual) => (atual ? { ...atual, endereco: { ...atual.endereco, ...campo } } : atual));
  const edicaoValida = edicao ? edicao.responsavel.nome.trim().length > 2 && soDigitos(edicao.responsavel.nis).length === 11 && edicao.pedidos.length > 0 : false;
  const familiaresValidos = familiares?.every((item) => item.nome.trim() && item.nascimento) ?? false;
  const tiposDaEdicao = estado.tipos.filter((tipo) => tipo.ativo || familia.doacoesSolicitadas.includes(tipo.id));

  return (
    <>
      <BarraTopo
        titulo={familia.responsavel.nome}
        descricao={`${familia.protocolo} · CPF ${formatarCpf(familia.responsavel.cpf)}`}
        acoes={
          familia.situacao === "pendente" ? (
            <button type="button" onClick={() => aprovar([familia.id])} className="ns-btn-success !px-3">
              Aprovar
            </button>
          ) : familia.situacao === "aprovado" ? (
            <button type="button" onClick={() => setEntregando(true)} className="ns-btn-success !px-3">
              <PackageCheck aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Registrar entrega</span>
              <span className="sr-only sm:hidden">Registrar entrega</span>
            </button>
          ) : undefined
        }
      />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Link href="/familias" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ns-text-secondary)] hover:text-[var(--ns-text)]">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Famílias
          </Link>

          <Secao
            titulo="Andamento"
            acao={
              <div className="flex flex-wrap items-center gap-2">
                <SeloSituacao situacao={familia.situacao} />
                {familia.situacao !== "recusado" && (
                  <>
                    <label htmlFor="etapa-ficha" className="sr-only">
                      Mover para outra etapa
                    </label>
                    <select id="etapa-ficha" value={familia.etapaId} onChange={(evento) => moverEtapa([familia.id], evento.target.value)} className="ns-input !w-auto !py-1.5">
                      {estado.etapas.map((etapa) => (
                        <option key={etapa.id} value={etapa.id}>
                          {etapa.titulo}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            }
          >
            {familia.situacao === "recusado" ? (
              <p className="text-sm text-[var(--ns-danger)]">Cadastro recusado. Motivo: {familia.motivoRecusa ?? "não informado"}. Para reabrir, use a tela de Aprovações.</p>
            ) : (
              <LinhaAndamento familia={familia} etapas={estado.etapas} />
            )}
          </Secao>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <BlocoDoacoes familia={familia} tipos={estado.tipos} />
              <BlocoDados
                familia={familia}
                acao={
                  <button
                    type="button"
                    onClick={() =>
                      setEdicao({
                        responsavel: familia.responsavel,
                        endereco: familia.endereco,
                        renda: familia.responsavel.rendaMensal === null ? "" : String(familia.responsavel.rendaMensal),
                        pedidos: familia.doacoesSolicitadas,
                        observacao: familia.observacaoNecessidade,
                      })
                    }
                    className="ns-btn-secondary !px-3 !py-2"
                  >
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                    Editar
                  </button>
                }
              />
              <BlocoFamiliares
                familia={familia}
                acao={
                  <button type="button" onClick={() => setFamiliares(familia.familiares)} className="ns-btn-secondary !px-3 !py-2">
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                    Editar
                  </button>
                }
              />
              <BlocoDocumentos familia={familia} />
            </div>
            <div className="space-y-4">
              <BlocoTaxa
                familia={familia}
                acao={
                  familia.taxa.situacao === "pendente" ? (
                    <button
                      type="button"
                      onClick={() => atualizarFamilia(familia.id, (atual) => ({ ...atual, taxa: { situacao: "paga", forma: "pix", pagaEm: new Date().toISOString() } }), "Taxa de adesão marcada como paga.")}
                      className="ns-btn-secondary !px-3 !py-2"
                    >
                      Marcar como paga
                    </button>
                  ) : undefined
                }
              />
              <BlocoHistorico familia={familia} />
            </div>
          </div>
        </div>
      </main>

      <RegistrarEntrega familia={entregando ? familia : null} aoFechar={() => setEntregando(false)} />

      <Modal
        aberto={edicao !== null}
        titulo="Editar cadastro"
        aoFechar={() => setEdicao(null)}
        largura="max-w-2xl"
        rodape={
          <>
            <button type="button" onClick={() => setEdicao(null)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!edicaoValida}
              onClick={() => {
                if (!edicao) return;
                atualizarFamilia(
                  familia.id,
                  (atual) => ({
                    ...atual,
                    responsavel: { ...edicao.responsavel, nome: edicao.responsavel.nome.trim(), rendaMensal: edicao.renda ? Number(edicao.renda) : null },
                    endereco: edicao.endereco,
                    doacoesSolicitadas: edicao.pedidos,
                    observacaoNecessidade: edicao.observacao.trim(),
                  }),
                  "Cadastro editado pela equipe.",
                );
                setEdicao(null);
              }}
              className="ns-btn-primary"
            >
              Salvar
            </button>
          </>
        }
      >
        {edicao && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTexto rotulo="Nome completo" valor={edicao.responsavel.nome} aoMudar={(nome) => mudarResponsavel({ nome })} className="sm:col-span-2" />
              <CampoTexto rotulo="Telefone" inputMode="tel" valor={formatarTelefone(edicao.responsavel.telefone)} aoMudar={(telefone) => mudarResponsavel({ telefone: soDigitos(telefone).slice(0, 11) })} />
              <CampoTexto rotulo="E-mail" type="email" valor={edicao.responsavel.email} aoMudar={(email) => mudarResponsavel({ email })} />
              <CampoTexto rotulo="NIS (CadÚnico)" inputMode="numeric" valor={formatarNis(edicao.responsavel.nis)} aoMudar={(nis) => mudarResponsavel({ nis: soDigitos(nis).slice(0, 11) })} />
              <CampoTexto rotulo="Renda mensal" opcional inputMode="numeric" valor={edicao.renda} aoMudar={(renda) => setEdicao((atual) => (atual ? { ...atual, renda: soDigitos(renda).slice(0, 6) } : atual))} />
              <CampoTexto rotulo="Rua, quadra ou conjunto" valor={edicao.endereco.logradouro} aoMudar={(logradouro) => mudarEndereco({ logradouro })} className="sm:col-span-2" />
              <CampoTexto rotulo="Número / lote" opcional valor={edicao.endereco.numero} aoMudar={(numero) => mudarEndereco({ numero })} />
              <CampoTexto rotulo="Bairro" valor={edicao.endereco.bairro} aoMudar={(bairro) => mudarEndereco({ bairro })} />
            </div>
            <fieldset>
              <legend className="ns-label">O que a família precisa receber</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {tiposDaEdicao.map((tipo) => {
                  const marcado = edicao.pedidos.includes(tipo.id);
                  return (
                    <label key={tipo.id} className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium text-[var(--ns-text)] ${marcado ? "border-[var(--ns-primary)]" : "border-[var(--ns-border)]"}`}>
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => setEdicao((atual) => (atual ? { ...atual, pedidos: marcado ? atual.pedidos.filter((item) => item !== tipo.id) : [...atual.pedidos, tipo.id] } : atual))}
                        className="h-5 w-5 accent-[var(--ns-primary)]"
                      />
                      {tipo.nome}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="observacao-edicao" className="ns-label">
                Observação
              </label>
              <textarea id="observacao-edicao" rows={2} value={edicao.observacao} onChange={(evento) => setEdicao((atual) => (atual ? { ...atual, observacao: evento.target.value } : atual))} className="ns-input" />
            </div>
            {!edicaoValida && <p className="text-xs font-medium text-[var(--ns-danger)]">Para salvar: nome, NIS com 11 números e pelo menos um item pedido.</p>}
          </div>
        )}
      </Modal>

      <Modal
        aberto={familiares !== null}
        titulo="Editar familiares"
        aoFechar={() => setFamiliares(null)}
        rodape={
          <>
            <button type="button" onClick={() => setFamiliares(null)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!familiaresValidos}
              onClick={() => {
                if (!familiares) return;
                atualizarFamilia(familia.id, (atual) => ({ ...atual, familiares }), "Familiares atualizados pela equipe.");
                setFamiliares(null);
              }}
              className="ns-btn-primary"
            >
              Salvar
            </button>
          </>
        }
      >
        {familiares && <EditorFamiliares familiares={familiares} aoMudar={setFamiliares} />}
      </Modal>
    </>
  );
}
