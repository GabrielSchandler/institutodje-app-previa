// Máscaras e formatadores (base: src/lib/clients/masks.ts do GRSCRM).

export function soDigitos(valor: string | null | undefined) {
  return valor?.replace(/\D/g, "") ?? "";
}

export function formatarCpf(valor: string | null | undefined) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatarTelefone(valor: string | null | undefined) {
  const d = soDigitos(valor)
    .replace(/^55(?=\d{10,11}$)/, "")
    .slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatarCep(valor: string | null | undefined) {
  const d = soDigitos(valor).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** NIS (CadÚnico): 11 dígitos, exibido como 000.00000.00-0. */
export function formatarNis(valor: string | null | undefined) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 8) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8, 10)}-${d.slice(10)}`;
}

export function formatarMoeda(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return "Não informada";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso: string | null | undefined) {
  if (!iso) return "—";
  // Datas "só dia" (aaaa-mm-dd) não podem passar pelo fuso, senão voltam um dia.
  const soDia = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const data = soDia ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR");
}

export function formatarDataHora(iso: string | null | undefined) {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function horaCurta(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function diasDesde(iso: string, agora = Date.now()) {
  return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 86_400_000));
}

/** "hoje", "há 1 dia", "há 12 dias" — usado no tempo de espera da esteira. */
export function tempoDeEspera(iso: string, agora = Date.now()) {
  const dias = diasDesde(iso, agora);
  if (dias === 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  return `há ${dias} dias`;
}

export function idade(nascimento: string | null | undefined, agora = new Date()) {
  if (!nascimento) return null;
  const data = new Date(`${nascimento}T12:00:00`);
  if (Number.isNaN(data.getTime())) return null;
  let anos = agora.getFullYear() - data.getFullYear();
  const antesDoAniversario =
    agora.getMonth() < data.getMonth() || (agora.getMonth() === data.getMonth() && agora.getDate() < data.getDate());
  if (antesDoAniversario) anos -= 1;
  return anos;
}

export function iniciais(nome: string | null | undefined) {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

/** Comparação sem acento e sem caixa, para as buscas. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function novoId(prefixo: string) {
  return `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
