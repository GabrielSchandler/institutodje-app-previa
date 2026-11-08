"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, HandHeart, LogOut, PartyPopper, XCircle } from "lucide-react";
import { EditorFamiliares } from "@/components/familia/editor-familiares";
import { BlocoDados, BlocoDoacoes, BlocoDocumentos, BlocoFamiliares, BlocoTaxa, LinhaAndamento, Secao } from "@/components/familia/ficha";
import { BotaoTema } from "@/components/shell/botao-tema";
import { FaixaDemo } from "@/components/shell/faixa-demo";
import { Modal } from "@/components/ui/modal";
import { Carregando } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";
import { tiposPendentes, type Familia, type Familiar } from "@/lib/demo/tipos";
import { INSTITUTO } from "@/lib/instituto";

function resumoDoAndamento(familia: Familia, papel: string | null | undefined) {
  if (familia.situacao === "recusado") {
    return {
      icone: XCircle,
      cor: "var(--ns-danger)",
      titulo: "Seu cadastro não foi aprovado",
      texto: familia.motivoRecusa ? `Motivo informado pelo instituto: ${familia.motivoRecusa}` : "Fale com o instituto para entender o motivo.",
    };
  }
  if (familia.situacao === "pendente") {
    return { icone: Clock, cor: "var(--ns-warning)", titulo: "Seu cadastro está em análise", texto: "O instituto vai conferir seus dados e documentos. Você não precisa fazer mais nada agora." };
  }
  const faltam = tiposPendentes(familia).length;
  if (papel === "concluida" && faltam === 0) {
    return { icone: CheckCircle2, cor: "var(--ns-success)", titulo: "Você já recebeu a sua doação", texto: "Tudo o que você pediu foi entregue. Veja os detalhes abaixo." };
  }
  if (familia.entregas.length > 0) {
    return {
      icone: HandHeart,
      cor: "var(--ns-primary)",
      titulo: faltam === 1 ? "Falta 1 item para você receber" : `Faltam ${faltam} itens para você receber`,
      texto: "Parte do que você pediu já foi entregue. O restante segue na fila.",
    };
  }
  return { icone: HandHeart, cor: "var(--ns-primary)", titulo: "Cadastro aprovado. Você está na fila", texto: "Assim que a doação estiver disponível, o instituto entra em contato pelo seu telefone." };
}

function Conteudo() {
  const router = useRouter();
  const parametros = useSearchParams();
  const { pronto, sessao, familiaAtual: familia, estado, sair, atualizarFamilia } = useArmazem();
  const [editando, setEditando] = useState<Familiar[] | null>(null);

  useEffect(() => {
    if (!pronto) return;
    if (sessao?.tipo === "admin") router.replace("/painel");
    else if (!familia) router.replace("/login");
  }, [pronto, sessao, familia, router]);

  if (!pronto || !familia) return <Carregando />;

  const etapa = estado.etapas.find((item) => item.id === familia.etapaId);
  const resumo = resumoDoAndamento(familia, etapa?.papel);
  const Icone = resumo.icone;
  const primeiroNome = familia.responsavel.nome.split(" ")[0];
  const familiaresValidos = editando?.every((item) => item.nome.trim() && item.nascimento) ?? false;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--ns-bg)]">
      <FaixaDemo />
      <header className="border-b border-[var(--ns-border)] bg-[var(--ns-surface)]">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--ns-text-secondary)]">{INSTITUTO.nomeCurto}</p>
            <h1 className="truncate text-lg font-semibold text-[var(--ns-text)]">Olá, {primeiroNome}</h1>
          </div>
          <BotaoTema />
          <button
            type="button"
            onClick={() => {
              sair();
              router.replace("/login");
            }}
            className="ns-btn-secondary !px-3"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-4 px-4 py-5">
        {parametros.get("novo") === "1" && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--ns-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--ns-success)_10%,transparent)] px-4 py-3 text-sm font-medium text-[var(--ns-text)]">
            <PartyPopper aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ns-success)]" />
            Cadastro enviado. Guarde o seu protocolo: {familia.protocolo}.
          </p>
        )}

        <section className="ns-card p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${resumo.cor} 14%, transparent)`, color: resumo.cor }}>
              <Icone aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-snug text-[var(--ns-text)] sm:text-xl">{resumo.titulo}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--ns-text-secondary)]">{resumo.texto}</p>
              <p className="mt-2 text-xs text-[var(--ns-text-secondary)]">Protocolo {familia.protocolo}</p>
            </div>
          </div>
          {familia.situacao !== "recusado" && (
            <div className="mt-6 border-t border-[var(--ns-border)] pt-5">
              <LinhaAndamento familia={familia} etapas={estado.etapas} />
            </div>
          )}
        </section>

        <BlocoDoacoes familia={familia} tipos={estado.tipos} />
        <BlocoFamiliares
          familia={familia}
          acao={
            <button type="button" onClick={() => setEditando(familia.familiares)} className="ns-btn-secondary !px-3 !py-2">
              Atualizar familiares
            </button>
          }
        />
        <BlocoDados familia={familia} />
        <BlocoDocumentos familia={familia} />
        <BlocoTaxa
          familia={familia}
          acao={
            familia.taxa.situacao === "pendente" ? (
              <button
                type="button"
                onClick={() => atualizarFamilia(familia.id, (atual) => ({ ...atual, taxa: { situacao: "paga", forma: "pix", pagaEm: new Date().toISOString() } }), "Taxa de adesão paga por Pix.")}
                className="ns-btn-primary !px-3 !py-2"
              >
                Pagar com Pix (simulado)
              </button>
            ) : undefined
          }
        />

        <Secao titulo="Precisa de ajuda?">
          <p className="text-sm leading-6 text-[var(--ns-text-secondary)]">
            Para corrigir um dado ou tirar dúvidas, fale com o instituto pelo WhatsApp. A equipe atende pelo mesmo número e vê o seu cadastro durante a conversa.
          </p>
        </Secao>
      </main>

      <Modal
        aberto={editando !== null}
        titulo="Atualizar familiares"
        descricao="Inclua quem passou a morar com você ou remova quem saiu."
        aoFechar={() => setEditando(null)}
        rodape={
          <>
            <button type="button" onClick={() => setEditando(null)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!familiaresValidos}
              onClick={() => {
                if (!editando) return;
                atualizarFamilia(familia.id, (atual) => ({ ...atual, familiares: editando }), "Familiares atualizados pela família.");
                setEditando(null);
              }}
              className="ns-btn-primary"
            >
              Salvar
            </button>
          </>
        }
      >
        {editando && <EditorFamiliares familiares={editando} aoMudar={setEditando} />}
        {editando && !familiaresValidos && <p className="mt-3 text-xs text-[var(--ns-text-secondary)]">Preencha nome e data de nascimento de todos para salvar.</p>}
      </Modal>
    </div>
  );
}

export default function PaginaMinhaArea() {
  // useSearchParams exige um limite de Suspense para o build estático.
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
