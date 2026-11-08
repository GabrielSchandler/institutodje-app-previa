// Tipos do protótipo. Nada aqui é esquema de banco: é o formato dos dados fictícios em memória.

/**
 * Papel fixo de uma etapa. O administrador pode renomear, recolorir e reordenar
 * qualquer etapa, mas o sistema precisa saber qual é a de entrada (cadastro novo),
 * a fila (aprovado, esperando doação) e a de conclusão (doação entregue).
 * Etapas criadas pelo administrador não têm papel.
 */
export type PapelEtapa = "entrada" | "fila" | "concluida";

export type Etapa = {
  id: string;
  titulo: string;
  descricao: string;
  cor: string;
  papel: PapelEtapa | null;
};

export type TipoDoacao = {
  id: string;
  nome: string;
  ativo: boolean;
};

export type Parentesco = "filho" | "irmao" | "pai" | "mae" | "conjuge" | "avo" | "neto" | "outro";

export const PARENTESCOS: Array<{ valor: Parentesco; rotulo: string }> = [
  { valor: "filho", rotulo: "Filho(a)" },
  { valor: "irmao", rotulo: "Irmão(ã)" },
  { valor: "pai", rotulo: "Pai" },
  { valor: "mae", rotulo: "Mãe" },
  { valor: "conjuge", rotulo: "Cônjuge" },
  { valor: "avo", rotulo: "Avô(ó)" },
  { valor: "neto", rotulo: "Neto(a)" },
  { valor: "outro", rotulo: "Outro" },
];

export function rotuloParentesco(valor: Parentesco) {
  return PARENTESCOS.find((item) => item.valor === valor)?.rotulo ?? "Outro";
}

export type Familiar = {
  id: string;
  nome: string;
  parentesco: Parentesco;
  nascimento: string;
  cpf: string;
};

export type TipoDocumento = "rg_frente" | "rg_verso" | "cpf" | "comprovante_residencia" | "foto";

export const DOCUMENTOS: Array<{ tipo: TipoDocumento; rotulo: string; obrigatorio: boolean }> = [
  { tipo: "rg_frente", rotulo: "RG (frente)", obrigatorio: true },
  { tipo: "rg_verso", rotulo: "RG (verso)", obrigatorio: true },
  { tipo: "cpf", rotulo: "CPF", obrigatorio: true },
  { tipo: "comprovante_residencia", rotulo: "Comprovante de residência", obrigatorio: true },
  { tipo: "foto", rotulo: "Foto 3x4", obrigatorio: false },
];

export type Documento = {
  tipo: TipoDocumento;
  nomeArquivo: string;
  enviadoEm: string;
};

export type FormaPagamento = "pix" | "cartao" | "boleto";

export type Taxa = {
  situacao: "paga" | "pendente";
  forma: FormaPagamento | null;
  pagaEm: string | null;
};

export const VALOR_TAXA = 10;

export type Entrega = {
  id: string;
  tipoId: string;
  quantidade: number;
  data: string;
  entreguePor: string;
  observacao: string;
};

export type EventoHistorico = {
  id: string;
  quando: string;
  texto: string;
  autor: string;
};

export type SituacaoCadastro = "pendente" | "aprovado" | "recusado";

export type Responsavel = {
  nome: string;
  cpf: string;
  rg: string;
  nascimento: string;
  telefone: string;
  email: string;
  nis: string;
  rendaMensal: number | null;
};

export type Endereco = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type Familia = {
  id: string;
  protocolo: string;
  criadoEm: string;
  situacao: SituacaoCadastro;
  motivoRecusa: string | null;
  etapaId: string;
  entrouNaEtapaEm: string;
  responsavel: Responsavel;
  endereco: Endereco;
  familiares: Familiar[];
  doacoesSolicitadas: string[];
  observacaoNecessidade: string;
  documentos: Documento[];
  taxa: Taxa;
  entregas: Entrega[];
  historico: EventoHistorico[];
  /** Só existe porque é protótipo: senha em texto puro NUNCA vai para o sistema real. */
  senhaDemo: string;
};

export type MembroEquipe = {
  id: string;
  nome: string;
  email: string;
  papel: "administrador" | "atendente";
  ativo: boolean;
  senhaDemo: string;
};

export type Sessao = { tipo: "admin"; membroId: string } | { tipo: "familia"; familiaId: string };

export type Canal = {
  id: string;
  nome: string;
  numero: string;
};

export type ConversaEstado = "IA" | "AGUARDANDO_HUMANO" | "HUMANO" | "ENCERRADA";

export type Mensagem = {
  id: string;
  autor: "contato" | "ia" | "atendente" | "sistema" | "nota";
  autorNome: string | null;
  texto: string;
  quando: string;
};

export type Conversa = {
  id: string;
  nome: string;
  telefone: string;
  familiaId: string | null;
  canalId: string;
  estado: ConversaEstado;
  responsavelId: string | null;
  naoLidas: number;
  ultimaAtividade: string;
  mensagens: Mensagem[];
};

export type Estado = {
  versao: number;
  familias: Familia[];
  etapas: Etapa[];
  tipos: TipoDoacao[];
  equipe: MembroEquipe[];
  canais: Canal[];
  conversas: Conversa[];
};

/** Dados que a família preenche na tela de cadastro. */
export type NovoCadastro = {
  responsavel: Responsavel;
  endereco: Endereco;
  familiares: Familiar[];
  doacoesSolicitadas: string[];
  observacaoNecessidade: string;
  documentos: Documento[];
  taxa: Taxa;
  senha: string;
};

/** Itens que ainda faltam entregar para a família (pedidos sem nenhuma entrega registrada). */
export function tiposPendentes(familia: Familia) {
  const entregues = new Set(familia.entregas.map((entrega) => entrega.tipoId));
  return familia.doacoesSolicitadas.filter((tipoId) => !entregues.has(tipoId));
}

export function pessoasNaFamilia(familia: Familia) {
  return 1 + familia.familiares.length;
}
