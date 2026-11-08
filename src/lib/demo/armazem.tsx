"use client";

// "Banco de dados" do protótipo: estado em memória, guardado no localStorage do navegador.
// Cada função aqui equivale a uma operação que, no sistema real, vai virar uma chamada ao servidor.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { novoId } from "@/lib/formatos";
import { criarEstadoInicial, VERSAO_DADOS } from "./semente";
import type { Conversa, Estado, Etapa, Familia, MembroEquipe, Mensagem, NovoCadastro, Sessao, TipoDoacao } from "./tipos";

const CHAVE_DADOS = "instituto-demo-dados";
const CHAVE_SESSAO = "instituto-demo-sessao";

export type ItemEntrega = { tipoId: string; quantidade: number };

type Armazem = {
  /** false até o navegador ler o localStorage; as telas mostram "Carregando" enquanto isso. */
  pronto: boolean;
  estado: Estado;
  sessao: Sessao | null;
  membroAtual: MembroEquipe | null;
  familiaAtual: Familia | null;

  entrar: (email: string, senha: string) => Sessao | null;
  entrarComo: (tipo: "admin" | "familia") => Sessao;
  sair: () => void;

  cadastrarFamilia: (dados: NovoCadastro) => string;
  atualizarFamilia: (id: string, alterar: (familia: Familia) => Familia, registro?: string) => void;
  aprovar: (ids: string[]) => void;
  recusar: (id: string, motivo: string) => void;
  moverEtapa: (ids: string[], etapaId: string, nota?: string) => void;
  registrarEntrega: (id: string, itens: ItemEntrega[], observacao: string, concluir: boolean) => void;

  salvarEtapas: (etapas: Etapa[]) => void;
  salvarTipos: (tipos: TipoDoacao[]) => void;
  salvarEquipe: (equipe: MembroEquipe[]) => void;

  enviarMensagem: (conversaId: string, texto: string, comoNota: boolean) => void;
  assumirConversa: (conversaId: string) => void;
  transferirConversa: (conversaId: string, membroId: string, nota: string) => void;
  concluirConversa: (conversaId: string) => void;
  reabrirConversa: (conversaId: string) => void;
  marcarLida: (conversaId: string) => void;

  restaurar: () => void;
};

const Contexto = createContext<Armazem | null>(null);

function ler<T>(chave: string): T | null {
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    if (valor === null) window.localStorage.removeItem(chave);
    else window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Navegação privada ou armazenamento cheio: o protótipo segue funcionando só em memória.
  }
}

const ESTADO_VAZIO: Estado = { versao: VERSAO_DADOS, familias: [], etapas: [], tipos: [], equipe: [], canais: [], conversas: [] };

export function ProvedorArmazem({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(ESTADO_VAZIO);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const salvo = ler<Estado>(CHAVE_DADOS);
    setEstado(salvo && salvo.versao === VERSAO_DADOS ? salvo : criarEstadoInicial());
    setSessao(ler<Sessao>(CHAVE_SESSAO));
    setPronto(true);
  }, []);

  useEffect(() => {
    if (pronto) gravar(CHAVE_DADOS, estado);
  }, [estado, pronto]);

  useEffect(() => {
    if (pronto) gravar(CHAVE_SESSAO, sessao);
  }, [sessao, pronto]);

  const membroAtual = useMemo(
    () => (sessao?.tipo === "admin" ? estado.equipe.find((membro) => membro.id === sessao.membroId) ?? null : null),
    [sessao, estado.equipe],
  );
  const familiaAtual = useMemo(
    () => (sessao?.tipo === "familia" ? estado.familias.find((familia) => familia.id === sessao.familiaId) ?? null : null),
    [sessao, estado.familias],
  );
  const autor = membroAtual?.nome ?? familiaAtual?.responsavel.nome ?? "Sistema";

  const alterarFamilias = useCallback((ids: string[], alterar: (familia: Familia) => Familia) => {
    setEstado((atual) => ({ ...atual, familias: atual.familias.map((familia) => (ids.includes(familia.id) ? alterar(familia) : familia)) }));
  }, []);

  const alterarConversa = useCallback((id: string, alterar: (conversa: Conversa) => Conversa) => {
    setEstado((atual) => ({ ...atual, conversas: atual.conversas.map((conversa) => (conversa.id === id ? alterar(conversa) : conversa)) }));
  }, []);

  const armazem = useMemo<Armazem>(() => {
    const evento = (texto: string) => ({ id: novoId("hist"), quando: new Date().toISOString(), texto, autor });
    const mensagem = (tipo: Mensagem["autor"], texto: string, autorNome: string | null = null): Mensagem => ({
      id: novoId("msg"),
      autor: tipo,
      autorNome,
      texto,
      quando: new Date().toISOString(),
    });
    const etapaPorPapel = (papel: Etapa["papel"]) => estado.etapas.find((etapa) => etapa.papel === papel) ?? estado.etapas[0];
    const nomeDaEtapa = (id: string) => estado.etapas.find((etapa) => etapa.id === id)?.titulo ?? "etapa";
    const nomeDoTipo = (id: string) => estado.tipos.find((tipo) => tipo.id === id)?.nome ?? "doação";

    return {
      pronto,
      estado,
      sessao,
      membroAtual,
      familiaAtual,

      entrar(email, senha) {
        const login = email.trim().toLowerCase();
        const membro = estado.equipe.find((item) => item.ativo && item.email.toLowerCase() === login && item.senhaDemo === senha);
        if (membro) {
          const nova: Sessao = { tipo: "admin", membroId: membro.id };
          setSessao(nova);
          return nova;
        }
        const familia = estado.familias.find((item) => item.responsavel.email.toLowerCase() === login && item.senhaDemo === senha);
        if (familia) {
          const nova: Sessao = { tipo: "familia", familiaId: familia.id };
          setSessao(nova);
          return nova;
        }
        return null;
      },

      entrarComo(tipo) {
        const nova: Sessao =
          tipo === "admin"
            ? { tipo: "admin", membroId: estado.equipe.find((item) => item.papel === "administrador")?.id ?? estado.equipe[0].id }
            : { tipo: "familia", familiaId: estado.familias[0].id };
        setSessao(nova);
        return nova;
      },

      sair() {
        setSessao(null);
      },

      cadastrarFamilia(dados) {
        const agora = new Date().toISOString();
        const id = novoId("familia");
        const maiorProtocolo = estado.familias.reduce((maior, familia) => Math.max(maior, Number(familia.protocolo.replace(/\D/g, "")) || 0), 1000);
        const nova: Familia = {
          id,
          protocolo: `DJE-${maiorProtocolo + 1}`,
          criadoEm: agora,
          situacao: "pendente",
          motivoRecusa: null,
          etapaId: etapaPorPapel("entrada").id,
          entrouNaEtapaEm: agora,
          responsavel: dados.responsavel,
          endereco: dados.endereco,
          familiares: dados.familiares,
          doacoesSolicitadas: dados.doacoesSolicitadas,
          observacaoNecessidade: dados.observacaoNecessidade,
          documentos: dados.documentos,
          taxa: dados.taxa,
          entregas: [],
          historico: [{ id: novoId("hist"), quando: agora, texto: "Cadastro realizado pela família.", autor: dados.responsavel.nome }],
          senhaDemo: dados.senha,
        };
        setEstado((atual) => ({ ...atual, familias: [...atual.familias, nova] }));
        setSessao({ tipo: "familia", familiaId: id });
        return id;
      },

      atualizarFamilia(id, alterar, registro) {
        alterarFamilias([id], (familia) => {
          const alterada = alterar(familia);
          return registro ? { ...alterada, historico: [...alterada.historico, evento(registro)] } : alterada;
        });
      },

      aprovar(ids) {
        const fila = etapaPorPapel("fila");
        const agora = new Date().toISOString();
        alterarFamilias(ids, (familia) => ({
          ...familia,
          situacao: "aprovado",
          motivoRecusa: null,
          etapaId: fila.id,
          entrouNaEtapaEm: agora,
          historico: [...familia.historico, evento(`Cadastro aprovado. Movido para ${fila.titulo}.`)],
        }));
      },

      recusar(id, motivo) {
        alterarFamilias([id], (familia) => ({
          ...familia,
          situacao: "recusado",
          motivoRecusa: motivo,
          historico: [...familia.historico, evento(`Cadastro recusado: ${motivo}`)],
        }));
      },

      moverEtapa(ids, etapaId, nota) {
        const destino = estado.etapas.find((etapa) => etapa.id === etapaId);
        if (!destino) return;
        const agora = new Date().toISOString();
        alterarFamilias(ids, (familia) => {
          if (familia.etapaId === etapaId) return familia;
          const texto = `Movido de ${nomeDaEtapa(familia.etapaId)} para ${destino.titulo}.${nota ? ` ${nota}` : ""}`;
          return {
            ...familia,
            // Sair da etapa de entrada equivale a aprovar; voltar para ela devolve à análise.
            situacao: destino.papel === "entrada" ? "pendente" : "aprovado",
            motivoRecusa: null,
            etapaId,
            entrouNaEtapaEm: agora,
            historico: [...familia.historico, evento(texto)],
          };
        });
      },

      registrarEntrega(id, itens, observacao, concluir) {
        const agora = new Date().toISOString();
        const concluida = etapaPorPapel("concluida");
        alterarFamilias([id], (familia) => {
          const entregas = itens.map((item) => ({ id: novoId("entrega"), tipoId: item.tipoId, quantidade: item.quantidade, data: agora, entreguePor: autor, observacao }));
          const descricao = itens.map((item) => `${nomeDoTipo(item.tipoId)}${item.quantidade > 1 ? ` (${item.quantidade})` : ""}`).join(", ");
          const historico = [...familia.historico, evento(`Entrega registrada: ${descricao}.${observacao ? ` ${observacao}` : ""}`)];
          const muda = concluir && familia.etapaId !== concluida.id;
          if (muda) historico.push(evento(`Movido de ${nomeDaEtapa(familia.etapaId)} para ${concluida.titulo}.`));
          return {
            ...familia,
            situacao: "aprovado",
            entregas: [...familia.entregas, ...entregas],
            etapaId: muda ? concluida.id : familia.etapaId,
            entrouNaEtapaEm: muda ? agora : familia.entrouNaEtapaEm,
            historico,
          };
        });
      },

      salvarEtapas(etapas) {
        setEstado((atual) => ({ ...atual, etapas }));
      },
      salvarTipos(tipos) {
        setEstado((atual) => ({ ...atual, tipos }));
      },
      salvarEquipe(equipe) {
        setEstado((atual) => ({ ...atual, equipe }));
      },

      enviarMensagem(conversaId, texto, comoNota) {
        alterarConversa(conversaId, (conversa) => ({
          ...conversa,
          // Quem responde assume: conversa que estava com a IA ou na fila passa a ser de quem escreveu.
          estado: comoNota ? conversa.estado : "HUMANO",
          responsavelId: comoNota ? conversa.responsavelId : (conversa.responsavelId ?? membroAtual?.id ?? null),
          naoLidas: 0,
          ultimaAtividade: new Date().toISOString(),
          mensagens: [...conversa.mensagens, mensagem(comoNota ? "nota" : "atendente", texto, autor)],
        }));
      },

      assumirConversa(conversaId) {
        alterarConversa(conversaId, (conversa) => ({
          ...conversa,
          estado: "HUMANO",
          responsavelId: membroAtual?.id ?? null,
          naoLidas: 0,
          mensagens: [...conversa.mensagens, mensagem("sistema", `${autor} assumiu a conversa.`)],
        }));
      },

      transferirConversa(conversaId, membroId, nota) {
        const destino = estado.equipe.find((membro) => membro.id === membroId);
        if (!destino) return;
        alterarConversa(conversaId, (conversa) => ({
          ...conversa,
          estado: "HUMANO",
          responsavelId: membroId,
          mensagens: [
            ...conversa.mensagens,
            mensagem("sistema", `${autor} transferiu a conversa para ${destino.nome}.`),
            ...(nota ? [mensagem("nota", nota, autor)] : []),
          ],
        }));
      },

      concluirConversa(conversaId) {
        alterarConversa(conversaId, (conversa) => ({
          ...conversa,
          estado: "ENCERRADA",
          naoLidas: 0,
          mensagens: [...conversa.mensagens, mensagem("sistema", `${autor} concluiu o atendimento.`)],
        }));
      },

      reabrirConversa(conversaId) {
        alterarConversa(conversaId, (conversa) => ({
          ...conversa,
          estado: "HUMANO",
          responsavelId: membroAtual?.id ?? conversa.responsavelId,
          mensagens: [...conversa.mensagens, mensagem("sistema", `${autor} reabriu o atendimento.`)],
        }));
      },

      marcarLida(conversaId) {
        alterarConversa(conversaId, (conversa) => (conversa.naoLidas ? { ...conversa, naoLidas: 0 } : conversa));
      },

      restaurar() {
        setEstado(criarEstadoInicial());
      },
    };
  }, [estado, sessao, pronto, membroAtual, familiaAtual, autor, alterarFamilias, alterarConversa]);

  return <Contexto.Provider value={armazem}>{children}</Contexto.Provider>;
}

export function useArmazem() {
  const armazem = useContext(Contexto);
  if (!armazem) throw new Error("useArmazem precisa estar dentro de <ProvedorArmazem>.");
  return armazem;
}
