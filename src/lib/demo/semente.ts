// Dados-semente do protótipo. Tudo aqui é FICTÍCIO: nomes, CPF, NIS, telefones e conversas
// são gerados e não pertencem a nenhuma pessoa real.

import type {
  Canal,
  Conversa,
  Documento,
  Entrega,
  Estado,
  Etapa,
  Familia,
  Familiar,
  MembroEquipe,
  Mensagem,
  Parentesco,
  TipoDoacao,
} from "./tipos";

export const VERSAO_DADOS = 1;

export const ETAPA_ENTRADA = "etapa-aguardando-aprovacao";
export const ETAPA_FILA = "etapa-aguardando-doacao";
export const ETAPA_CONCLUIDA = "etapa-doacao-recebida";

export const CONTA_ADMIN_DEMO = { email: "admin@instituto.org", senha: "123456" };
export const CONTA_FAMILIA_DEMO = { email: "maria@exemplo.com", senha: "123456" };

const etapasIniciais: Etapa[] = [
  {
    id: ETAPA_ENTRADA,
    titulo: "Aguardando aprovação",
    descricao: "A família concluiu o cadastro e aguarda a análise do instituto.",
    cor: "#E7A11F",
    papel: "entrada",
  },
  {
    id: ETAPA_FILA,
    titulo: "Aguardando doação",
    descricao: "Cadastro aprovado. A família está na fila para receber o que pediu.",
    cor: "#5267F5",
    papel: "fila",
  },
  {
    id: ETAPA_CONCLUIDA,
    titulo: "Doação recebida",
    descricao: "A família já recebeu a doação.",
    cor: "#12A976",
    papel: "concluida",
  },
];

const tiposIniciais: TipoDoacao[] = [
  { id: "tipo-cesta-basica", nome: "Cesta básica", ativo: true },
  { id: "tipo-cesta-verde", nome: "Verduras e legumes", ativo: true },
  { id: "tipo-roupas", nome: "Roupas", ativo: true },
  { id: "tipo-leite", nome: "Leite", ativo: true },
  { id: "tipo-fraldas", nome: "Fraldas geriátricas", ativo: true },
  { id: "tipo-cadeira-rodas", nome: "Cadeira de rodas", ativo: true },
  { id: "tipo-muletas", nome: "Muletas", ativo: true },
  { id: "tipo-equipamento-medico", nome: "Equipamento médico", ativo: true },
];

const equipeInicial: MembroEquipe[] = [
  { id: "membro-1", nome: "Gilmar Souza", email: CONTA_ADMIN_DEMO.email, papel: "administrador", ativo: true, senhaDemo: CONTA_ADMIN_DEMO.senha },
  { id: "membro-2", nome: "Renata Moreira", email: "renata@instituto.org", papel: "administrador", ativo: true, senhaDemo: "123456" },
  { id: "membro-3", nome: "Paulo Henrique Dias", email: "paulo@instituto.org", papel: "atendente", ativo: true, senhaDemo: "123456" },
  { id: "membro-4", nome: "Cláudia Ferraz", email: "claudia@instituto.org", papel: "atendente", ativo: true, senhaDemo: "123456" },
  { id: "membro-5", nome: "Tiago Barros", email: "tiago@instituto.org", papel: "atendente", ativo: true, senhaDemo: "123456" },
  { id: "membro-6", nome: "Luciana Prado", email: "luciana@instituto.org", papel: "atendente", ativo: true, senhaDemo: "123456" },
  { id: "membro-7", nome: "Edson Queiroz", email: "edson@instituto.org", papel: "atendente", ativo: true, senhaDemo: "123456" },
];

const canaisIniciais: Canal[] = [
  { id: "canal-1", nome: "WhatsApp principal", numero: "(61) 90000-0001" },
  { id: "canal-2", nome: "WhatsApp doações", numero: "(61) 90000-0002" },
];

const NOMES_F = ["Maria Aparecida", "Ana Paula", "Francisca", "Antônia", "Juliana", "Adriana", "Márcia", "Fernanda", "Patrícia", "Aline", "Sandra", "Camila", "Rosângela", "Luciene", "Vanessa", "Elaine", "Simone", "Josefa", "Raimunda", "Terezinha", "Cristiane", "Débora"];
const NOMES_M = ["José Carlos", "João Batista", "Antônio", "Francisco", "Carlos Eduardo", "Paulo Sérgio", "Luiz Fernando", "Marcos", "Raimundo", "Sebastião", "Edivaldo", "Wellington", "Valdir", "Geraldo"];
const SOBRENOMES = ["da Silva", "dos Santos", "Oliveira", "Souza", "Pereira", "Lima", "Ferreira", "Alves", "Rodrigues", "Gomes", "Ribeiro", "Martins", "Carvalho", "Araújo", "Barbosa", "Nascimento", "Rocha", "Dias", "Moreira", "Cardoso", "Teixeira", "Correia"];
const NOMES_CRIANCA = ["Pedro", "Ana Clara", "Lucas", "Maria Eduarda", "Gabriel", "Júlia", "Miguel", "Sophia", "Davi", "Laura", "Kauã", "Isabela", "Enzo", "Yasmin", "Samuel", "Letícia"];
const BAIRROS = ["Pedregal", "Lago Azul", "Boa Vista", "Lunabel", "Novo Gama Centro", "América do Sul", "Vale das Andorinhas", "Setor Araguaia"];

/** Gerador determinístico: a mesma semente sempre produz as mesmas famílias. */
function criarSorteio(semente: number) {
  let estado = semente;
  const proximo = () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
  return {
    inteiro: (min: number, max: number) => Math.floor(proximo() * (max - min + 1)) + min,
    escolher: <T,>(lista: T[]): T => lista[Math.floor(proximo() * lista.length)],
    chance: (probabilidade: number) => proximo() < probabilidade,
    digitos: (quantidade: number) => Array.from({ length: quantidade }, () => Math.floor(proximo() * 10)).join(""),
  };
}

function diasAtras(agora: number, dias: number, hora = 10) {
  const data = new Date(agora - dias * 86_400_000);
  data.setHours(hora, (dias * 7) % 60, 0, 0);
  return data.toISOString();
}

function nascimentoPorIdade(agora: number, anos: number, sorteio: ReturnType<typeof criarSorteio>) {
  const data = new Date(agora);
  data.setFullYear(data.getFullYear() - anos, sorteio.inteiro(0, 11), sorteio.inteiro(1, 28));
  return data.toISOString().slice(0, 10);
}

function gerarFamilias(agora: number): Familia[] {
  const sorteio = criarSorteio(20261013);
  const familias: Familia[] = [];
  const total = 42;

  for (let indice = 0; indice < total; indice += 1) {
    const mulher = sorteio.chance(0.72);
    const primeiroNome = indice === 0 ? "Maria Aparecida" : sorteio.escolher(mulher ? NOMES_F : NOMES_M);
    const sobrenome = indice === 0 ? "da Silva" : sorteio.escolher(SOBRENOMES);
    const sobrenomeDois = sorteio.escolher(SOBRENOMES.filter((item) => item !== sobrenome));
    const nome = indice === 0 ? "Maria Aparecida da Silva" : `${primeiroNome} ${sobrenome} ${sorteio.chance(0.4) ? sobrenomeDois : ""}`.trim();

    // Distribuição: 6 aguardando aprovação, 2 recusados, 20 na fila, 14 concluídos.
    const grupo: "entrada" | "recusado" | "fila" | "concluida" =
      indice === 0 ? "fila" : indice <= 6 ? "entrada" : indice <= 8 ? "recusado" : indice <= 27 ? "fila" : "concluida";

    const diasCadastro =
      grupo === "entrada" ? sorteio.inteiro(0, 6) : grupo === "recusado" ? sorteio.inteiro(20, 60) : grupo === "fila" ? sorteio.inteiro(8, 95) : sorteio.inteiro(40, 150);
    const criadoEm = diasAtras(agora, diasCadastro, sorteio.inteiro(8, 18));
    const diasAprovacao = Math.max(0, diasCadastro - sorteio.inteiro(1, 4));
    const aprovadoEm = diasAtras(agora, diasAprovacao, sorteio.inteiro(8, 18));

    const quantidadeFamiliares = indice === 0 ? 3 : sorteio.inteiro(0, 5);
    const familiares: Familiar[] = Array.from({ length: quantidadeFamiliares }, (_, posicao) => {
      const parentesco: Parentesco = posicao === 0 && sorteio.chance(0.35) ? "conjuge" : sorteio.chance(0.75) ? "filho" : sorteio.escolher<Parentesco>(["mae", "pai", "irmao", "neto", "avo"]);
      const anos = parentesco === "filho" || parentesco === "neto" ? sorteio.inteiro(1, 17) : parentesco === "mae" || parentesco === "pai" || parentesco === "avo" ? sorteio.inteiro(58, 84) : sorteio.inteiro(22, 55);
      const nomeFamiliar =
        parentesco === "filho" || parentesco === "neto" ? sorteio.escolher(NOMES_CRIANCA) : sorteio.escolher(sorteio.chance(0.5) ? NOMES_F : NOMES_M);
      return {
        id: `familiar-${indice}-${posicao}`,
        nome: `${nomeFamiliar} ${sobrenome}`,
        parentesco,
        nascimento: nascimentoPorIdade(agora, anos, sorteio),
        cpf: sorteio.digitos(11),
      };
    });

    const quantidadePedidos = indice === 0 ? 3 : sorteio.inteiro(1, 3);
    const pedidos: string[] = indice === 0 ? ["tipo-cesta-basica", "tipo-roupas", "tipo-leite"] : [];
    while (pedidos.length < quantidadePedidos) {
      // Cesta básica é de longe o pedido mais comum; equipamentos são raros.
      const tipo = sorteio.chance(0.55) ? "tipo-cesta-basica" : sorteio.chance(0.5) ? sorteio.escolher(["tipo-cesta-verde", "tipo-roupas", "tipo-leite"]) : sorteio.escolher(tiposIniciais).id;
      if (!pedidos.includes(tipo)) pedidos.push(tipo);
    }

    const entregador = () => sorteio.escolher(equipeInicial).nome;
    const entregas: Entrega[] = [];
    if (grupo === "concluida") {
      const diasEntrega = Math.max(1, diasAprovacao - sorteio.inteiro(3, 25));
      pedidos.forEach((tipoId, posicao) => {
        entregas.push({ id: `entrega-${indice}-${posicao}`, tipoId, quantidade: 1, data: diasAtras(agora, Math.max(0, diasEntrega - posicao), 14), entreguePor: entregador(), observacao: "" });
      });
    } else if (grupo === "fila" && pedidos.length > 1 && (indice === 0 || sorteio.chance(0.3))) {
      // Parte das famílias da fila já recebeu um dos itens e ainda espera os outros.
      entregas.push({ id: `entrega-${indice}-0`, tipoId: pedidos[0], quantidade: 1, data: diasAtras(agora, Math.max(1, diasAprovacao - 5), 15), entreguePor: entregador(), observacao: indice === 0 ? "Retirada na sede." : "" });
    }

    const documentosCompletos = grupo !== "entrada" || sorteio.chance(0.7);
    const documentos: Documento[] = (documentosCompletos ? (["rg_frente", "rg_verso", "cpf", "comprovante_residencia"] as const) : (["rg_frente", "cpf"] as const)).map((tipo) => ({
      tipo,
      nomeArquivo: `${tipo}.jpg`,
      enviadoEm: criadoEm,
    }));

    const taxaPaga = indice === 0 || sorteio.chance(grupo === "entrada" ? 0.5 : 0.8);
    const etapaId = grupo === "fila" ? ETAPA_FILA : grupo === "concluida" ? ETAPA_CONCLUIDA : ETAPA_ENTRADA;
    const ultimaEntrega = entregas.length ? entregas[entregas.length - 1].data : aprovadoEm;

    const historico = [{ id: `hist-${indice}-0`, quando: criadoEm, texto: "Cadastro realizado pela família.", autor: nome }];
    if (grupo === "fila" || grupo === "concluida") {
      historico.push({ id: `hist-${indice}-1`, quando: aprovadoEm, texto: "Cadastro aprovado. Movido para Aguardando doação.", autor: "Gilmar Souza" });
    }
    if (grupo === "recusado") {
      historico.push({ id: `hist-${indice}-1`, quando: aprovadoEm, texto: "Cadastro recusado: documentação não confere com os dados informados.", autor: "Renata Moreira" });
    }
    entregas.forEach((entrega, posicao) => {
      const tipo = tiposIniciais.find((item) => item.id === entrega.tipoId);
      historico.push({ id: `hist-${indice}-e${posicao}`, quando: entrega.data, texto: `Entrega registrada: ${tipo?.nome ?? "doação"}.`, autor: entrega.entreguePor });
    });

    familias.push({
      id: `familia-${indice + 1}`,
      protocolo: `DJE-${String(1000 + indice + 1)}`,
      criadoEm,
      situacao: grupo === "entrada" ? "pendente" : grupo === "recusado" ? "recusado" : "aprovado",
      motivoRecusa: grupo === "recusado" ? "Documentação não confere com os dados informados." : null,
      etapaId,
      entrouNaEtapaEm: grupo === "concluida" ? ultimaEntrega : grupo === "fila" ? aprovadoEm : criadoEm,
      responsavel: {
        nome,
        cpf: sorteio.digitos(11),
        rg: sorteio.digitos(7),
        nascimento: nascimentoPorIdade(agora, sorteio.inteiro(23, 67), sorteio),
        telefone: `619${sorteio.digitos(8)}`,
        email: indice === 0 ? CONTA_FAMILIA_DEMO.email : `familia${indice + 1}@exemplo.com`,
        nis: sorteio.digitos(11),
        rendaMensal: sorteio.chance(0.65) ? sorteio.inteiro(3, 16) * 100 : null,
      },
      endereco: {
        cep: `7286${sorteio.digitos(4)}`,
        logradouro: `Quadra ${sorteio.inteiro(1, 120)}, Lote ${sorteio.inteiro(1, 40)}`,
        numero: String(sorteio.inteiro(1, 60)),
        complemento: sorteio.chance(0.25) ? "Casa dos fundos" : "",
        bairro: sorteio.escolher(BAIRROS),
        cidade: "Novo Gama",
        uf: "GO",
      },
      familiares,
      doacoesSolicitadas: pedidos,
      observacaoNecessidade: indice === 0 ? "Roupas de criança, tamanhos 6 e 10." : sorteio.chance(0.2) ? "Idoso acamado em casa." : "",
      documentos,
      taxa: { situacao: taxaPaga ? "paga" : "pendente", forma: taxaPaga ? sorteio.escolher(["pix", "pix", "pix", "cartao", "boleto"] as const) : null, pagaEm: taxaPaga ? criadoEm : null },
      entregas,
      historico: historico.sort((a, b) => a.quando.localeCompare(b.quando)),
      senhaDemo: "123456",
    });
  }

  return familias;
}

function gerarConversas(agora: number, familias: Familia[]): Conversa[] {
  const minutosAtras = (minutos: number) => new Date(agora - minutos * 60_000).toISOString();
  let contador = 0;
  const msg = (autor: Mensagem["autor"], texto: string, minutos: number, autorNome: string | null = null): Mensagem => {
    contador += 1;
    return { id: `msg-${contador}`, autor, autorNome, texto, quando: minutosAtras(minutos) };
  };
  const maria = familias[0];
  const pendente = familias[2];
  const naFila = familias[12];

  return [
    {
      id: "conversa-1",
      nome: maria.responsavel.nome,
      telefone: maria.responsavel.telefone,
      familiaId: maria.id,
      canalId: "canal-1",
      estado: "AGUARDANDO_HUMANO",
      responsavelId: null,
      naoLidas: 2,
      ultimaAtividade: minutosAtras(6),
      mensagens: [
        msg("contato", "Boa tarde, queria saber quando chega a cesta básica.", 22),
        msg("ia", "Boa tarde, Maria! Sou a assistente virtual do instituto. Vi aqui que seu cadastro está aprovado e que a cesta básica já foi entregue. Ainda estão pendentes: roupas e leite.", 21, "Assistente virtual"),
        msg("contato", "A cesta eu recebi sim. É sobre as roupas das crianças, tem previsão?", 8),
        msg("ia", "Entendi. Vou chamar uma pessoa da equipe para confirmar a previsão das roupas com você.", 7, "Assistente virtual"),
        msg("sistema", "A assistente virtual encaminhou a conversa para a equipe.", 7),
        msg("contato", "Obrigada, fico no aguardo.", 6),
      ],
    },
    {
      id: "conversa-2",
      nome: pendente.responsavel.nome,
      telefone: pendente.responsavel.telefone,
      familiaId: pendente.id,
      canalId: "canal-1",
      estado: "IA",
      responsavelId: null,
      naoLidas: 0,
      ultimaAtividade: minutosAtras(38),
      mensagens: [
        msg("contato", "Oi, fiz o cadastro ontem. Já foi aprovado?", 40),
        msg("ia", "Olá! Seu cadastro foi recebido e está aguardando a análise do instituto. Assim que for aprovado você vê a mudança na sua área e eu aviso por aqui.", 39, "Assistente virtual"),
        msg("contato", "Tá bom, obrigada.", 38),
      ],
    },
    {
      id: "conversa-3",
      nome: naFila.responsavel.nome,
      telefone: naFila.responsavel.telefone,
      familiaId: naFila.id,
      canalId: "canal-2",
      estado: "HUMANO",
      responsavelId: "membro-1",
      naoLidas: 1,
      ultimaAtividade: minutosAtras(15),
      mensagens: [
        msg("contato", "Bom dia. Meu pai precisa de cadeira de rodas, coloquei no cadastro.", 190),
        msg("ia", "Bom dia! Está registrado no seu cadastro. Vou passar para a equipe verificar a disponibilidade.", 189, "Assistente virtual"),
        msg("sistema", "Gilmar Souza assumiu a conversa.", 120),
        msg("atendente", "Bom dia! Aqui é o Gilmar. Recebemos uma cadeira esta semana, consigo separar para vocês. Pode retirar na sede na quinta?", 119, "Gilmar Souza"),
        msg("nota", "Cadeira reservada no depósito, etiqueta 14.", 118, "Gilmar Souza"),
        msg("contato", "Posso sim, que horas?", 15),
      ],
    },
    {
      id: "conversa-4",
      nome: "Contato novo",
      telefone: "61988880004",
      familiaId: null,
      canalId: "canal-2",
      estado: "IA",
      responsavelId: null,
      naoLidas: 0,
      ultimaAtividade: minutosAtras(75),
      mensagens: [
        msg("contato", "Boa tarde, quero doar umas roupas. Como faço?", 77),
        msg("ia", "Boa tarde! Que bom. O instituto recebe apenas itens, não dinheiro. Você pode combinar a entrega por aqui e levar na sede, em Novo Gama. Quer que eu chame alguém da equipe para combinar o dia?", 76, "Assistente virtual"),
        msg("contato", "Pode ser amanhã cedo.", 75),
      ],
    },
    {
      id: "conversa-5",
      nome: familias[15].responsavel.nome,
      telefone: familias[15].responsavel.telefone,
      familiaId: familias[15].id,
      canalId: "canal-1",
      estado: "HUMANO",
      responsavelId: "membro-4",
      naoLidas: 0,
      ultimaAtividade: minutosAtras(260),
      mensagens: [
        msg("contato", "Mudei de endereço, como atualizo?", 300),
        msg("sistema", "Cláudia Ferraz assumiu a conversa.", 280),
        msg("atendente", "Olá! Pode me passar o endereço novo que eu atualizo no seu cadastro.", 279, "Cláudia Ferraz"),
        msg("contato", "Quadra 45, lote 12, Pedregal.", 262),
        msg("atendente", "Atualizado. Qualquer coisa é só chamar.", 260, "Cláudia Ferraz"),
      ],
    },
    {
      id: "conversa-6",
      nome: familias[30].responsavel.nome,
      telefone: familias[30].responsavel.telefone,
      familiaId: familias[30].id,
      canalId: "canal-1",
      estado: "ENCERRADA",
      responsavelId: "membro-3",
      naoLidas: 0,
      ultimaAtividade: minutosAtras(1500),
      mensagens: [
        msg("contato", "Recebi a cesta hoje, muito obrigada!", 1510),
        msg("atendente", "Que bom! Ficamos felizes em ajudar.", 1502, "Paulo Henrique Dias"),
        msg("sistema", "Paulo Henrique Dias concluiu o atendimento.", 1500),
      ],
    },
  ];
}

export function criarEstadoInicial(agora = Date.now()): Estado {
  const familias = gerarFamilias(agora);
  return {
    versao: VERSAO_DADOS,
    familias,
    etapas: etapasIniciais,
    tipos: tiposIniciais,
    equipe: equipeInicial,
    canais: canaisIniciais,
    conversas: gerarConversas(agora, familias),
  };
}
