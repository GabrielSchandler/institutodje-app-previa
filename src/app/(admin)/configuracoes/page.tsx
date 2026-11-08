"use client";

import { useState } from "react";
import { Plus, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { EditorEsteira } from "@/components/esteira/editor-esteira";
import { Secao } from "@/components/familia/ficha";
import { BarraTopo } from "@/components/shell/barra-topo";
import { CampoSelecao, CampoTexto } from "@/components/ui/formulario";
import { Modal } from "@/components/ui/modal";
import { useArmazem } from "@/lib/demo/armazem";
import type { MembroEquipe } from "@/lib/demo/tipos";
import { novoId } from "@/lib/formatos";

function Interruptor({ ligado, aoMudar, rotulo }: { ligado: boolean; aoMudar: (valor: boolean) => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => aoMudar(!ligado)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${ligado ? "bg-[var(--ns-success)]" : "bg-[var(--ns-border)]"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${ligado ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function PaginaConfiguracoes() {
  const { estado, membroAtual, salvarTipos, salvarEquipe, restaurar } = useArmazem();
  const [novoTipo, setNovoTipo] = useState("");
  const [editandoEsteira, setEditandoEsteira] = useState(false);
  const [confirmarRestauro, setConfirmarRestauro] = useState(false);
  const [novoMembro, setNovoMembro] = useState<{ nome: string; email: string; papel: MembroEquipe["papel"] } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const usoDoTipo = (id: string) => estado.familias.filter((familia) => familia.doacoesSolicitadas.includes(id) || familia.entregas.some((entrega) => entrega.tipoId === id)).length;
  const nomeRepetido = estado.tipos.some((tipo) => tipo.nome.trim().toLowerCase() === novoTipo.trim().toLowerCase());
  const emailRepetido = novoMembro ? estado.equipe.some((membro) => membro.email.toLowerCase() === novoMembro.email.trim().toLowerCase()) : false;
  const membroValido = novoMembro ? novoMembro.nome.trim().length > 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoMembro.email.trim()) && !emailRepetido : false;

  function adicionarTipo(evento: React.FormEvent) {
    evento.preventDefault();
    const nome = novoTipo.trim();
    if (!nome || nomeRepetido) return;
    salvarTipos([...estado.tipos, { id: novoId("tipo"), nome, ativo: true }]);
    setNovoTipo("");
    setAviso(`Tipo de doação “${nome}” adicionado. Ele já aparece no cadastro das famílias.`);
  }

  return (
    <>
      <BarraTopo titulo="Configurações" descricao="Tipos de doação, etapas da esteira e equipe." />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <p role="status" aria-live="polite" className={aviso ? "rounded-lg border border-[color-mix(in_srgb,var(--ns-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--ns-success)_10%,transparent)] px-3 py-2 text-sm font-medium text-[var(--ns-text)]" : "sr-only"}>
            {aviso}
          </p>

          <Secao titulo="Tipos de doação">
            <p className="-mt-2 mb-4 text-sm text-[var(--ns-text-secondary)]">São os itens que a família marca no cadastro. Desativar tira o item do cadastro novo sem apagar o histórico.</p>
            <ul className="divide-y divide-[var(--ns-border)]">
              {estado.tipos.map((tipo) => {
                const uso = usoDoTipo(tipo.id);
                return (
                  <li key={tipo.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`tipo-${tipo.id}`} className="sr-only">
                        Nome do tipo de doação
                      </label>
                      <input
                        id={`tipo-${tipo.id}`}
                        value={tipo.nome}
                        onChange={(evento) => salvarTipos(estado.tipos.map((item) => (item.id === tipo.id ? { ...item, nome: evento.target.value } : item)))}
                        className={`ns-input font-medium ${tipo.ativo ? "" : "opacity-60"}`}
                      />
                      <p className="mt-1 text-xs text-[var(--ns-text-secondary)]">{uso === 0 ? "Nenhuma família usa este item." : `${uso} ${uso === 1 ? "família usa" : "famílias usam"} este item.`}</p>
                    </div>
                    <Interruptor ligado={tipo.ativo} aoMudar={(ativo) => salvarTipos(estado.tipos.map((item) => (item.id === tipo.id ? { ...item, ativo } : item)))} rotulo={`${tipo.nome} ativo no cadastro`} />
                    <button
                      type="button"
                      disabled={uso > 0}
                      onClick={() => salvarTipos(estado.tipos.filter((item) => item.id !== tipo.id))}
                      aria-label={`Excluir ${tipo.nome}`}
                      title={uso > 0 ? "Em uso: desative em vez de excluir" : "Excluir"}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--ns-danger)] hover:bg-[color-mix(in_srgb,var(--ns-danger)_10%,transparent)] disabled:text-[var(--ns-text-secondary)] disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <form onSubmit={adicionarTipo} className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--ns-border)] pt-4">
              <CampoTexto rotulo="Novo tipo de doação" valor={novoTipo} aoMudar={setNovoTipo} placeholder="Ex.: Material escolar" erro={novoTipo.trim() && nomeRepetido ? "Já existe um tipo com este nome." : undefined} className="min-w-[200px] flex-1" />
              <button type="submit" disabled={!novoTipo.trim() || nomeRepetido} className="ns-btn-primary">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Adicionar
              </button>
            </form>
          </Secao>

          <Secao
            titulo="Etapas da esteira"
            acao={
              <button type="button" onClick={() => setEditandoEsteira(true)} className="ns-btn-secondary !px-3 !py-2">
                <Settings2 aria-hidden="true" className="h-4 w-4" />
                Editar esteira
              </button>
            }
          >
            <ol className="flex flex-wrap gap-2">
              {estado.etapas.map((etapa, indice) => (
                <li key={etapa.id} className="flex items-center gap-2 rounded-lg border border-[var(--ns-border)] px-3 py-2 text-sm font-medium text-[var(--ns-text)]">
                  <span className="tabular-nums text-[var(--ns-text-secondary)]">{indice + 1}</span>
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: etapa.cor }} />
                  {etapa.titulo}
                </li>
              ))}
            </ol>
          </Secao>

          <Secao
            titulo={`Equipe (${estado.equipe.length})`}
            acao={
              <button type="button" onClick={() => setNovoMembro({ nome: "", email: "", papel: "atendente" })} className="ns-btn-secondary !px-3 !py-2">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Adicionar pessoa
              </button>
            }
          >
            <p className="-mt-2 mb-4 text-sm text-[var(--ns-text-secondary)]">Todos atendem pelos mesmos números de WhatsApp. Administradores também aprovam cadastros e mudam as configurações.</p>
            <ul className="divide-y divide-[var(--ns-border)]">
              {estado.equipe.map((membro) => {
                const voce = membro.id === membroAtual?.id;
                return (
                  <li key={membro.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold text-[var(--ns-text)] ${membro.ativo ? "" : "opacity-60"}`}>
                        {membro.nome}
                        {voce && <span className="ml-1.5 font-normal text-[var(--ns-text-secondary)]">(você)</span>}
                      </p>
                      <p className="truncate text-xs text-[var(--ns-text-secondary)]">{membro.email}</p>
                    </div>
                    <label htmlFor={`papel-${membro.id}`} className="sr-only">
                      Papel de {membro.nome}
                    </label>
                    <select
                      id={`papel-${membro.id}`}
                      value={membro.papel}
                      disabled={voce}
                      onChange={(evento) => salvarEquipe(estado.equipe.map((item) => (item.id === membro.id ? { ...item, papel: evento.target.value as MembroEquipe["papel"] } : item)))}
                      className="ns-input !w-auto !py-1.5 disabled:opacity-60"
                    >
                      <option value="administrador">Administrador</option>
                      <option value="atendente">Atendente</option>
                    </select>
                    {!voce && <Interruptor ligado={membro.ativo} aoMudar={(ativo) => salvarEquipe(estado.equipe.map((item) => (item.id === membro.id ? { ...item, ativo } : item)))} rotulo={`Acesso de ${membro.nome} ativo`} />}
                  </li>
                );
              })}
            </ul>
          </Secao>

          <Secao titulo="Números de WhatsApp">
            <ul className="grid gap-2 sm:grid-cols-2">
              {estado.canais.map((canal) => (
                <li key={canal.id} className="rounded-lg border border-[var(--ns-border)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--ns-text)]">{canal.nome}</p>
                  <p className="text-xs tabular-nums text-[var(--ns-text-secondary)]">{canal.numero} · simulado</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--ns-text-secondary)]">Na versão final, cada número é conectado lendo um QR Code, como no WhatsApp Web.</p>
          </Secao>

          <Secao titulo="Dados de demonstração">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-lg text-sm text-[var(--ns-text-secondary)]">Apaga tudo o que foi feito neste navegador e volta às famílias, etapas e conversas de exemplo.</p>
              <button type="button" onClick={() => setConfirmarRestauro(true)} className="ns-btn-danger">
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Restaurar demonstração
              </button>
            </div>
          </Secao>
        </div>
      </main>

      <EditorEsteira aberto={editandoEsteira} aoFechar={() => setEditandoEsteira(false)} />

      <Modal
        aberto={novoMembro !== null}
        titulo="Adicionar pessoa à equipe"
        aoFechar={() => setNovoMembro(null)}
        rodape={
          <>
            <button type="button" onClick={() => setNovoMembro(null)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!membroValido}
              onClick={() => {
                if (!novoMembro) return;
                salvarEquipe([...estado.equipe, { id: novoId("membro"), nome: novoMembro.nome.trim(), email: novoMembro.email.trim().toLowerCase(), papel: novoMembro.papel, ativo: true, senhaDemo: "123456" }]);
                setAviso(`${novoMembro.nome.trim()} entrou na equipe. Senha provisória da demonstração: 123456.`);
                setNovoMembro(null);
              }}
              className="ns-btn-primary"
            >
              Adicionar
            </button>
          </>
        }
      >
        {novoMembro && (
          <div className="grid gap-4">
            <CampoTexto rotulo="Nome" valor={novoMembro.nome} aoMudar={(nome) => setNovoMembro({ ...novoMembro, nome })} />
            <CampoTexto rotulo="E-mail" type="email" valor={novoMembro.email} aoMudar={(email) => setNovoMembro({ ...novoMembro, email })} erro={emailRepetido ? "Este e-mail já está na equipe." : undefined} />
            <CampoSelecao
              rotulo="Papel"
              valor={novoMembro.papel}
              aoMudar={(papel) => setNovoMembro({ ...novoMembro, papel: papel as MembroEquipe["papel"] })}
              opcoes={[
                { valor: "atendente", rotulo: "Atendente: atende no WhatsApp e registra entregas" },
                { valor: "administrador", rotulo: "Administrador: também aprova e configura" },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        aberto={confirmarRestauro}
        titulo="Restaurar os dados de demonstração?"
        descricao="Cadastros, entregas, etapas e conversas criados neste navegador serão apagados."
        aoFechar={() => setConfirmarRestauro(false)}
        rodape={
          <>
            <button type="button" onClick={() => setConfirmarRestauro(false)} className="ns-btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                restaurar();
                setConfirmarRestauro(false);
                setAviso("Dados de demonstração restaurados.");
              }}
              className="ns-btn-danger-solid"
            >
              Restaurar
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--ns-text-secondary)]">Você continua conectado como administrador.</p>
      </Modal>
    </>
  );
}
