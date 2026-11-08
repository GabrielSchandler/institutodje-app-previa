"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { FaixaDemo } from "@/components/shell/faixa-demo";
import { BotaoTema } from "@/components/shell/botao-tema";
import { CampoTexto } from "@/components/ui/formulario";
import { useArmazem } from "@/lib/demo/armazem";
import { INSTITUTO } from "@/lib/instituto";

export default function PaginaLogin() {
  const router = useRouter();
  const { pronto, entrar, entrarComo } = useArmazem();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function seguir(tipo: "admin" | "familia") {
    router.push(tipo === "admin" ? "/painel" : "/minha-area");
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const sessao = entrar(email, senha);
    if (!sessao) {
      setErro("E-mail ou senha não conferem. Confira os dados e tente de novo.");
      return;
    }
    seguir(sessao.tipo);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--ns-bg)]">
      <FaixaDemo />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Painel de identificação: no celular vira um cabeçalho curto. */}
        <div className="flex flex-col justify-between gap-6 bg-[#10172F] px-6 py-8 text-white lg:px-12 lg:py-12">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5267F5] text-xs font-bold tracking-wide">{INSTITUTO.sigla}</span>
            <span className="text-sm font-semibold text-[#C8D1E3]">{INSTITUTO.cidade}</span>
          </div>
          <div>
            <h1 className="max-w-md text-2xl font-semibold leading-tight lg:text-4xl">{INSTITUTO.nome}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#A9B6D0] lg:text-base">
              Cadastro das famílias atendidas e acompanhamento das doações, do pedido até a entrega.
            </p>
          </div>
          <p className="hidden text-xs text-[#8F9BB3] lg:block">Cada família vê apenas o próprio cadastro.</p>
        </div>

        <div className="flex items-start justify-center px-4 py-8 sm:px-8 lg:items-center">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--ns-text)]">Entrar</h2>
                <p className="mt-1 text-sm text-[var(--ns-text-secondary)]">Use o e-mail e a senha do seu cadastro.</p>
              </div>
              <BotaoTema />
            </div>

            <form onSubmit={enviar} className="space-y-4" noValidate>
              <CampoTexto rotulo="E-mail" type="email" autoComplete="username" inputMode="email" valor={email} aoMudar={setEmail} required />
              <CampoTexto rotulo="Senha" type="password" autoComplete="current-password" valor={senha} aoMudar={setSenha} required />
              {erro && (
                <p role="alert" className="rounded-lg border border-[color-mix(in_srgb,var(--ns-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--ns-danger)_10%,transparent)] px-3 py-2 text-sm font-medium text-[var(--ns-danger)]">
                  {erro}
                </p>
              )}
              <button type="submit" disabled={!pronto} className="ns-btn-primary w-full !py-3">
                Entrar
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[var(--ns-text-secondary)]">
              Ainda não tem cadastro?{" "}
              <Link href="/cadastro" className="font-semibold text-[var(--ns-primary)] underline-offset-4 hover:underline">
                Cadastrar minha família
              </Link>
            </p>

            <div className="mt-8 border-t border-[var(--ns-border)] pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ns-text-secondary)]">Acesso de demonstração</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!pronto}
                  onClick={() => seguir(entrarComo("admin").tipo)}
                  className="ns-btn-secondary !justify-start !py-3 text-left"
                >
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--ns-primary)]" />
                  <span>
                    <span className="block">Administrador</span>
                    <span className="block text-xs font-normal text-[var(--ns-text-secondary)]">Vê todos os cadastros</span>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!pronto}
                  onClick={() => seguir(entrarComo("familia").tipo)}
                  className="ns-btn-secondary !justify-start !py-3 text-left"
                >
                  <UserRound aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--ns-primary)]" />
                  <span>
                    <span className="block">Família</span>
                    <span className="block text-xs font-normal text-[var(--ns-text-secondary)]">Vê só o próprio cadastro</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
