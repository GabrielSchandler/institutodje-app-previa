"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, UserSearch } from "lucide-react";
import { BarraTopo } from "@/components/shell/barra-topo";
import { ChipsDoacao, EstadoVazio, SeloAndamento } from "@/components/ui/pecas";
import { useArmazem } from "@/lib/demo/armazem";
import { pessoasNaFamilia } from "@/lib/demo/tipos";
import { formatarCpf, formatarData, normalizar, soDigitos } from "@/lib/formatos";

type FiltroRecebimento = "" | "recebeu" | "nao_recebeu";

export default function PaginaFamilias() {
  const { estado } = useArmazem();
  const [busca, setBusca] = useState("");
  const [andamento, setAndamento] = useState("");
  const [recebimento, setRecebimento] = useState<FiltroRecebimento>("");

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    const numeros = soDigitos(busca);
    return estado.familias
      .filter((familia) => {
        if (andamento === "recusado" ? familia.situacao !== "recusado" : andamento && (familia.situacao === "recusado" || familia.etapaId !== andamento)) return false;
        if (recebimento === "recebeu" && familia.entregas.length === 0) return false;
        if (recebimento === "nao_recebeu" && (familia.entregas.length > 0 || familia.situacao !== "aprovado")) return false;
        if (!termo) return true;
        return (
          normalizar(familia.responsavel.nome).includes(termo) ||
          normalizar(familia.protocolo).includes(termo) ||
          familia.familiares.some((familiar) => normalizar(familiar.nome).includes(termo)) ||
          (numeros.length >= 3 && (familia.responsavel.cpf.includes(numeros) || familia.responsavel.nis.includes(numeros)))
        );
      })
      .sort((a, b) => a.responsavel.nome.localeCompare(b.responsavel.nome, "pt-BR"));
  }, [estado.familias, busca, andamento, recebimento]);

  return (
    <>
      <BarraTopo titulo="Famílias" descricao="Todos os cadastros do instituto." />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 sm:max-w-sm">
              <label htmlFor="busca-familias" className="sr-only">
                Buscar por nome, familiar, CPF, NIS ou protocolo
              </label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ns-text-secondary)]" />
                <input id="busca-familias" type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Nome, familiar, CPF, NIS ou protocolo" className="ns-input !pl-9" />
              </div>
            </div>
            <div className="min-w-[160px] flex-1 sm:max-w-[220px]">
              <label htmlFor="filtro-andamento" className="sr-only">
                Filtrar por andamento
              </label>
              <select id="filtro-andamento" value={andamento} onChange={(evento) => setAndamento(evento.target.value)} className="ns-input">
                <option value="">Todos os andamentos</option>
                {estado.etapas.map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.titulo}
                  </option>
                ))}
                <option value="recusado">Recusado</option>
              </select>
            </div>
            <div className="min-w-[160px] flex-1 sm:max-w-[220px]">
              <label htmlFor="filtro-recebimento" className="sr-only">
                Filtrar por recebimento
              </label>
              <select id="filtro-recebimento" value={recebimento} onChange={(evento) => setRecebimento(evento.target.value as FiltroRecebimento)} className="ns-input">
                <option value="">Receberam e não receberam</option>
                <option value="recebeu">Já receberam alguma doação</option>
                <option value="nao_recebeu">Aprovadas que ainda não receberam</option>
              </select>
            </div>
            <p className="ml-auto text-sm text-[var(--ns-text-secondary)]" aria-live="polite">
              {lista.length} {lista.length === 1 ? "família" : "famílias"}
            </p>
          </div>

          <div className="mt-4">
            {lista.length === 0 ? (
              <EstadoVazio icone={UserSearch} titulo="Nenhuma família encontrada" texto="Confira a busca ou limpe os filtros." />
            ) : (
              <>
                {/* Computador: tabela. */}
                <div className="ns-card hidden overflow-hidden md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--ns-surface-alt)] text-xs font-semibold text-[var(--ns-text-secondary)]">
                      <tr>
                        <th scope="col" className="px-4 py-3">Família</th>
                        <th scope="col" className="px-4 py-3">CPF</th>
                        <th scope="col" className="px-4 py-3 text-right">Pessoas</th>
                        <th scope="col" className="px-4 py-3">Pedidos</th>
                        <th scope="col" className="px-4 py-3">Andamento</th>
                        <th scope="col" className="px-4 py-3">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ns-border)]">
                      {lista.map((familia) => (
                        <tr key={familia.id} className="transition-colors hover:bg-[var(--ns-surface-hover)]">
                          <td className="px-4 py-3">
                            <Link href={`/familias/${familia.id}`} className="font-semibold text-[var(--ns-text)] underline-offset-2 hover:underline">
                              {familia.responsavel.nome}
                            </Link>
                            <p className="text-xs text-[var(--ns-text-secondary)]">
                              {familia.protocolo} · {familia.endereco.bairro}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--ns-text)]">{formatarCpf(familia.responsavel.cpf)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-[var(--ns-text)]">{pessoasNaFamilia(familia)}</td>
                          <td className="px-4 py-3">
                            <ChipsDoacao familia={familia} tipos={estado.tipos} compacto />
                          </td>
                          <td className="px-4 py-3">
                            <SeloAndamento familia={familia} etapas={estado.etapas} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--ns-text-secondary)]">{formatarData(familia.criadoEm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Celular: cartões. */}
                <ul className="space-y-2 md:hidden">
                  {lista.map((familia) => (
                    <li key={familia.id}>
                      <Link href={`/familias/${familia.id}`} className="ns-card block p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--ns-text)]">{familia.responsavel.nome}</p>
                            <p className="text-xs text-[var(--ns-text-secondary)]">
                              {familia.protocolo} · {pessoasNaFamilia(familia)} {pessoasNaFamilia(familia) === 1 ? "pessoa" : "pessoas"} · {familia.endereco.bairro}
                            </p>
                          </div>
                          <SeloAndamento familia={familia} etapas={estado.etapas} />
                        </div>
                        <div className="mt-2.5">
                          <ChipsDoacao familia={familia} tipos={estado.tipos} compacto />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
