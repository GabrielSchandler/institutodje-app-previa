"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, QrCode } from "lucide-react";
import { EditorFamiliares } from "@/components/familia/editor-familiares";
import { FaixaDemo } from "@/components/shell/faixa-demo";
import { CampoTexto } from "@/components/ui/formulario";
import { useArmazem } from "@/lib/demo/armazem";
import { DOCUMENTOS, VALOR_TAXA, type Documento, type Endereco, type Familiar, type FormaPagamento, type Responsavel, type Taxa, type TipoDocumento } from "@/lib/demo/tipos";
import { formatarCep, formatarCpf, formatarMoeda, formatarNis, formatarTelefone, soDigitos } from "@/lib/formatos";
import { INSTITUTO } from "@/lib/instituto";

const PASSOS = ["Seus dados", "Endereço", "Familiares", "O que você precisa", "Documentos", "Taxa de adesão", "Acesso"] as const;

const FORMAS: Array<{ valor: FormaPagamento; rotulo: string; detalhe: string }> = [
  { valor: "pix", rotulo: "Pix", detalhe: "Confirmação na hora" },
  { valor: "cartao", rotulo: "Cartão de crédito", detalhe: "Confirmação na hora" },
  { valor: "boleto", rotulo: "Boleto bancário", detalhe: "Confirma em até 2 dias úteis" },
];

type Erros = Record<string, string>;

export default function PaginaCadastro() {
  const router = useRouter();
  const { pronto, estado, cadastrarFamilia } = useArmazem();
  const topo = useRef<HTMLDivElement>(null);

  const [passo, setPasso] = useState(0);
  const [erros, setErros] = useState<Erros>({});
  const [responsavel, setResponsavel] = useState<Responsavel>({ nome: "", cpf: "", rg: "", nascimento: "", telefone: "", email: "", nis: "", rendaMensal: null });
  const [renda, setRenda] = useState("");
  const [endereco, setEndereco] = useState<Endereco>({ cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "Novo Gama", uf: "GO" });
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [pedidos, setPedidos] = useState<string[]>([]);
  const [observacao, setObservacao] = useState("");
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [taxa, setTaxa] = useState<Taxa>({ situacao: "pendente", forma: "pix", pagaEm: null });
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  const tiposAtivos = estado.tipos.filter((tipo) => tipo.ativo);
  const mudarResponsavel = (campo: Partial<Responsavel>) => setResponsavel((atual) => ({ ...atual, ...campo }));
  const mudarEndereco = (campo: Partial<Endereco>) => setEndereco((atual) => ({ ...atual, ...campo }));

  function validar(indice: number): Erros {
    const e: Erros = {};
    if (indice === 0) {
      if (responsavel.nome.trim().split(/\s+/).length < 2) e.nome = "Informe o nome completo.";
      if (soDigitos(responsavel.cpf).length !== 11) e.cpf = "O CPF tem 11 números.";
      if (!responsavel.nascimento) e.nascimento = "Informe a data de nascimento.";
      if (soDigitos(responsavel.telefone).length < 10) e.telefone = "Informe o telefone com DDD.";
      if (soDigitos(responsavel.nis).length !== 11) e.nis = "O NIS do CadÚnico tem 11 números.";
    }
    if (indice === 1) {
      if (!endereco.logradouro.trim()) e.logradouro = "Informe a rua ou quadra.";
      if (!endereco.bairro.trim()) e.bairro = "Informe o bairro.";
      if (!endereco.cidade.trim()) e.cidade = "Informe a cidade.";
    }
    if (indice === 2) {
      familiares.forEach((familiar) => {
        if (!familiar.nome.trim()) e[`${familiar.id}.nome`] = "Informe o nome.";
        if (!familiar.nascimento) e[`${familiar.id}.nascimento`] = "Informe a data.";
      });
    }
    if (indice === 3 && pedidos.length === 0) e.pedidos = "Marque pelo menos um item.";
    if (indice === 4) {
      const faltando = DOCUMENTOS.filter((doc) => doc.obrigatorio && !documentos.some((item) => item.tipo === doc.tipo));
      if (faltando.length) e.documentos = `Falta enviar: ${faltando.map((doc) => doc.rotulo).join(", ")}.`;
    }
    if (indice === 6) {
      const email = responsavel.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Informe um e-mail válido.";
      else if (estado.familias.some((familia) => familia.responsavel.email.toLowerCase() === email) || estado.equipe.some((membro) => membro.email.toLowerCase() === email))
        e.email = "Este e-mail já tem cadastro. Use a tela de entrar.";
      if (senha.length < 6) e.senha = "A senha precisa de pelo menos 6 caracteres.";
      if (confirmacao !== senha) e.confirmacao = "As senhas não são iguais.";
    }
    return e;
  }

  function irPara(indice: number) {
    setPasso(indice);
    setErros({});
    // Volta ao topo e leva o foco para o título do passo (leitor de tela anuncia a troca).
    requestAnimationFrame(() => topo.current?.focus());
  }

  function avancar(evento: React.FormEvent) {
    evento.preventDefault();
    const encontrados = validar(passo);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    if (passo < PASSOS.length - 1) {
      irPara(passo + 1);
      return;
    }

    cadastrarFamilia({
      responsavel: { ...responsavel, nome: responsavel.nome.trim(), email: responsavel.email.trim().toLowerCase(), rendaMensal: renda ? Number(renda) : null },
      endereco,
      familiares,
      doacoesSolicitadas: pedidos,
      observacaoNecessidade: observacao.trim(),
      documentos,
      taxa: taxa.situacao === "paga" ? taxa : { situacao: "pendente", forma: null, pagaEm: null },
      senha,
    });
    router.push("/minha-area?novo=1");
  }

  function anexar(tipo: TipoDocumento, arquivo: File | undefined) {
    if (!arquivo) return;
    // Protótipo: guarda só o nome do arquivo. Nada é enviado nem armazenado.
    setDocumentos((atual) => [...atual.filter((doc) => doc.tipo !== tipo), { tipo, nomeArquivo: arquivo.name, enviadoEm: new Date().toISOString() }]);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--ns-bg)]">
      <FaixaDemo />
      <header className="border-b border-[var(--ns-border)] bg-[var(--ns-surface)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-semibold text-[var(--ns-text)]">{INSTITUTO.nomeCurto}</span>
          <Link href="/login" className="text-sm font-semibold text-[var(--ns-primary)] underline-offset-4 hover:underline">
            Já tenho cadastro
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div ref={topo} tabIndex={-1} className="scroll-mt-4 outline-none">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ns-text-secondary)]">
            Passo {passo + 1} de {PASSOS.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--ns-text)]">{PASSOS[passo]}</h1>
        </div>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--ns-border)]"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={PASSOS.length}
          aria-valuenow={passo + 1}
          aria-label="Andamento do cadastro"
        >
          <div className="h-full rounded-full bg-[var(--ns-primary)] transition-[width] duration-300" style={{ width: `${((passo + 1) / PASSOS.length) * 100}%` }} />
        </div>

        <form onSubmit={avancar} noValidate className="mt-6">
          {passo === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTexto rotulo="Nome completo" autoComplete="name" valor={responsavel.nome} aoMudar={(nome) => mudarResponsavel({ nome })} erro={erros.nome} className="sm:col-span-2" />
              <CampoTexto rotulo="CPF" inputMode="numeric" placeholder="000.000.000-00" valor={formatarCpf(responsavel.cpf)} aoMudar={(cpf) => mudarResponsavel({ cpf: soDigitos(cpf).slice(0, 11) })} erro={erros.cpf} />
              <CampoTexto rotulo="RG" opcional inputMode="numeric" valor={responsavel.rg} aoMudar={(rg) => mudarResponsavel({ rg })} />
              <CampoTexto rotulo="Data de nascimento" type="date" autoComplete="bday" valor={responsavel.nascimento} aoMudar={(nascimento) => mudarResponsavel({ nascimento })} erro={erros.nascimento} />
              <CampoTexto rotulo="Telefone (WhatsApp)" type="tel" inputMode="tel" autoComplete="tel" placeholder="(61) 90000-0000" valor={formatarTelefone(responsavel.telefone)} aoMudar={(telefone) => mudarResponsavel({ telefone: soDigitos(telefone).slice(0, 11) })} erro={erros.telefone} />
              <CampoTexto
                rotulo="NIS (CadÚnico)"
                inputMode="numeric"
                placeholder="000.00000.00-0"
                valor={formatarNis(responsavel.nis)}
                aoMudar={(nis) => mudarResponsavel({ nis: soDigitos(nis).slice(0, 11) })}
                erro={erros.nis}
                ajuda="Número de 11 dígitos que aparece no cartão do Bolsa Família ou na folha do CadÚnico."
              />
              <CampoTexto
                rotulo="Renda mensal da família"
                opcional
                inputMode="numeric"
                placeholder="Ex.: 800"
                valor={renda}
                aoMudar={(valor) => setRenda(soDigitos(valor).slice(0, 6))}
                ajuda="Em reais, sem centavos. Não é preciso comprovar."
              />
            </div>
          )}

          {passo === 1 && (
            <div className="grid gap-4 sm:grid-cols-6">
              <CampoTexto rotulo="CEP" opcional inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" valor={formatarCep(endereco.cep)} aoMudar={(cep) => mudarEndereco({ cep: soDigitos(cep).slice(0, 8) })} className="sm:col-span-2" />
              <CampoTexto rotulo="Rua, quadra ou conjunto" autoComplete="address-line1" valor={endereco.logradouro} aoMudar={(logradouro) => mudarEndereco({ logradouro })} erro={erros.logradouro} className="sm:col-span-4" />
              <CampoTexto rotulo="Número / lote" opcional valor={endereco.numero} aoMudar={(numero) => mudarEndereco({ numero })} className="sm:col-span-2" />
              <CampoTexto rotulo="Complemento" opcional valor={endereco.complemento} aoMudar={(complemento) => mudarEndereco({ complemento })} className="sm:col-span-4" />
              <CampoTexto rotulo="Bairro" valor={endereco.bairro} aoMudar={(bairro) => mudarEndereco({ bairro })} erro={erros.bairro} className="sm:col-span-3" />
              <CampoTexto rotulo="Cidade" autoComplete="address-level2" valor={endereco.cidade} aoMudar={(cidade) => mudarEndereco({ cidade })} erro={erros.cidade} className="sm:col-span-2" />
              <CampoTexto rotulo="UF" maxLength={2} autoComplete="address-level1" valor={endereco.uf} aoMudar={(uf) => mudarEndereco({ uf: uf.toUpperCase() })} className="sm:col-span-1" />
            </div>
          )}

          {passo === 2 && (
            <>
              <p className="mb-4 text-sm text-[var(--ns-text-secondary)]">Adicione as pessoas que moram com você: filhos, pais, irmãos ou outros.</p>
              <EditorFamiliares familiares={familiares} aoMudar={setFamiliares} erros={erros} />
            </>
          )}

          {passo === 3 && (
            <fieldset>
              <legend className="mb-4 text-sm text-[var(--ns-text-secondary)]">Marque tudo o que a sua família precisa receber. Pode marcar mais de um item.</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {tiposAtivos.map((tipo) => {
                  const marcado = pedidos.includes(tipo.id);
                  return (
                    <label
                      key={tipo.id}
                      className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        marcado
                          ? "border-[var(--ns-primary)] bg-[color-mix(in_srgb,var(--ns-primary)_8%,var(--ns-surface))] text-[var(--ns-text)]"
                          : "border-[var(--ns-border)] bg-[var(--ns-surface)] text-[var(--ns-text)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => setPedidos((atual) => (marcado ? atual.filter((id) => id !== tipo.id) : [...atual, tipo.id]))}
                        className="h-5 w-5 shrink-0 accent-[var(--ns-primary)]"
                      />
                      {tipo.nome}
                    </label>
                  );
                })}
              </div>
              {erros.pedidos && (
                <p role="alert" className="mt-2 text-xs font-medium text-[var(--ns-danger)]">
                  {erros.pedidos}
                </p>
              )}
              <label htmlFor="observacao" className="ns-label mt-5">
                Alguma observação? <span className="font-normal text-[var(--ns-text-secondary)]">(opcional)</span>
              </label>
              <textarea
                id="observacao"
                rows={3}
                value={observacao}
                onChange={(evento) => setObservacao(evento.target.value)}
                placeholder="Ex.: tamanho das roupas, idoso acamado, restrição alimentar."
                className="ns-input"
              />
            </fieldset>
          )}

          {passo === 4 && (
            <>
              <p className="mb-4 text-sm text-[var(--ns-text-secondary)]">Tire uma foto legível de cada documento. Aceita JPG, PNG ou PDF de até 5 MB.</p>
              <ul className="space-y-3">
                {DOCUMENTOS.map((doc) => {
                  const enviado = documentos.find((item) => item.tipo === doc.tipo);
                  return (
                    <li key={doc.tipo} className="flex items-center gap-3 rounded-xl border border-[var(--ns-border)] bg-[var(--ns-surface)] p-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          enviado ? "bg-[color-mix(in_srgb,var(--ns-success)_14%,transparent)] text-[var(--ns-success)]" : "bg-[var(--ns-surface-alt)] text-[var(--ns-text-secondary)]"
                        }`}
                      >
                        {enviado ? <Check aria-hidden="true" className="h-5 w-5" /> : <FileUp aria-hidden="true" className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--ns-text)]">
                          {doc.rotulo}
                          {!doc.obrigatorio && <span className="ml-1 font-normal text-[var(--ns-text-secondary)]">(opcional)</span>}
                        </p>
                        <p className="truncate text-xs text-[var(--ns-text-secondary)]">{enviado ? enviado.nomeArquivo : "Ainda não enviado"}</p>
                      </div>
                      <label className="ns-btn-secondary shrink-0 cursor-pointer !px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ns-primary)]">
                        {enviado ? "Trocar" : "Enviar foto"}
                        <span className="sr-only"> de {doc.rotulo}</span>
                        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(evento) => anexar(doc.tipo, evento.target.files?.[0])} />
                      </label>
                    </li>
                  );
                })}
              </ul>
              {erros.documentos && (
                <p role="alert" className="mt-3 text-sm font-medium text-[var(--ns-danger)]">
                  {erros.documentos}
                </p>
              )}
            </>
          )}

          {passo === 5 && (
            <>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--ns-border)] bg-[var(--ns-surface)] p-4">
                <div>
                  <p className="text-sm text-[var(--ns-text-secondary)]">Taxa simbólica de adesão</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--ns-text)]">{formatarMoeda(VALOR_TAXA)}</p>
                </div>
                {taxa.situacao === "paga" && (
                  <span className="ns-badge ns-badge-success gap-1">
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Paga
                  </span>
                )}
              </div>

              {taxa.situacao === "pendente" ? (
                <>
                  <fieldset className="mt-5">
                    <legend className="ns-label">Forma de pagamento</legend>
                    <div className="space-y-2">
                      {FORMAS.map((forma) => (
                        <label
                          key={forma.valor}
                          className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                            taxa.forma === forma.valor ? "border-[var(--ns-primary)] bg-[color-mix(in_srgb,var(--ns-primary)_8%,var(--ns-surface))]" : "border-[var(--ns-border)] bg-[var(--ns-surface)]"
                          }`}
                        >
                          <input type="radio" name="forma" checked={taxa.forma === forma.valor} onChange={() => setTaxa((atual) => ({ ...atual, forma: forma.valor }))} className="h-5 w-5 accent-[var(--ns-primary)]" />
                          <span>
                            <span className="block text-sm font-semibold text-[var(--ns-text)]">{forma.rotulo}</span>
                            <span className="block text-xs text-[var(--ns-text-secondary)]">{forma.detalhe}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button type="button" onClick={() => setTaxa((atual) => ({ ...atual, situacao: "paga", pagaEm: new Date().toISOString() }))} className="ns-btn-secondary mt-4 w-full !py-3">
                    <QrCode aria-hidden="true" className="h-4 w-4" />
                    Pagar agora (simulado)
                  </button>
                  <p className="mt-3 text-center text-xs text-[var(--ns-text-secondary)]">Você também pode continuar e pagar depois. O cadastro é analisado do mesmo jeito.</p>
                </>
              ) : (
                <p className="mt-4 text-sm text-[var(--ns-text-secondary)]">Pagamento registrado. O comprovante fica disponível na sua área.</p>
              )}
            </>
          )}

          {passo === 6 && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ns-text-secondary)]">Com este e-mail e senha você entra para acompanhar o seu cadastro e as doações.</p>
              <CampoTexto rotulo="E-mail" type="email" inputMode="email" autoComplete="email" valor={responsavel.email} aoMudar={(email) => mudarResponsavel({ email })} erro={erros.email} />
              <CampoTexto rotulo="Crie uma senha" type="password" autoComplete="new-password" valor={senha} aoMudar={setSenha} erro={erros.senha} ajuda="Pelo menos 6 caracteres." />
              <CampoTexto rotulo="Repita a senha" type="password" autoComplete="new-password" valor={confirmacao} aoMudar={setConfirmacao} erro={erros.confirmacao} />
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {passo > 0 && (
              <button type="button" onClick={() => irPara(passo - 1)} className="ns-btn-secondary !py-3">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Voltar
              </button>
            )}
            <button type="submit" disabled={!pronto} className="ns-btn-primary flex-1 !py-3">
              {passo === PASSOS.length - 1 ? "Concluir cadastro" : passo === 5 && taxa.situacao === "pendente" ? "Continuar e pagar depois" : "Continuar"}
              {passo < PASSOS.length - 1 && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
