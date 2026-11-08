"use client";

import { Plus, Trash2 } from "lucide-react";
import { CampoSelecao, CampoTexto } from "@/components/ui/formulario";
import { formatarCpf, novoId } from "@/lib/formatos";
import { PARENTESCOS, type Familiar, type Parentesco } from "@/lib/demo/tipos";

/** Lista editável de familiares, usada no cadastro e na edição da ficha. */
export function EditorFamiliares({ familiares, aoMudar, erros = {} }: { familiares: Familiar[]; aoMudar: (lista: Familiar[]) => void; erros?: Record<string, string> }) {
  const alterar = (id: string, campo: Partial<Familiar>) => aoMudar(familiares.map((familiar) => (familiar.id === id ? { ...familiar, ...campo } : familiar)));

  return (
    <div className="space-y-4">
      {familiares.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--ns-border)] px-4 py-6 text-center text-sm text-[var(--ns-text-secondary)]">
          Nenhum familiar adicionado. Se você mora sozinho(a), pode seguir sem adicionar.
        </p>
      )}

      {familiares.map((familiar, indice) => (
        <fieldset key={familiar.id} className="rounded-xl border border-[var(--ns-border)] bg-[var(--ns-surface)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <legend className="text-sm font-semibold text-[var(--ns-text)]">Familiar {indice + 1}</legend>
            <button
              type="button"
              onClick={() => aoMudar(familiares.filter((item) => item.id !== familiar.id))}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--ns-danger)] hover:bg-[color-mix(in_srgb,var(--ns-danger)_10%,transparent)]"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Remover<span className="sr-only"> familiar {indice + 1}</span>
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              rotulo="Nome completo"
              valor={familiar.nome}
              aoMudar={(nome) => alterar(familiar.id, { nome })}
              erro={erros[`${familiar.id}.nome`]}
              autoComplete="off"
              className="sm:col-span-2"
            />
            <CampoSelecao
              rotulo="Parentesco"
              valor={familiar.parentesco}
              aoMudar={(parentesco) => alterar(familiar.id, { parentesco: parentesco as Parentesco })}
              opcoes={PARENTESCOS.map((item) => ({ valor: item.valor, rotulo: item.rotulo }))}
            />
            <CampoTexto
              rotulo="Data de nascimento"
              type="date"
              valor={familiar.nascimento}
              aoMudar={(nascimento) => alterar(familiar.id, { nascimento })}
              erro={erros[`${familiar.id}.nascimento`]}
            />
            <CampoTexto
              rotulo="CPF"
              opcional
              inputMode="numeric"
              placeholder="000.000.000-00"
              valor={formatarCpf(familiar.cpf)}
              aoMudar={(cpf) => alterar(familiar.id, { cpf: cpf.replace(/\D/g, "").slice(0, 11) })}
              autoComplete="off"
            />
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={() => aoMudar([...familiares, { id: novoId("familiar"), nome: "", parentesco: "filho", nascimento: "", cpf: "" }])}
        className="ns-btn-secondary w-full !py-3"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Adicionar familiar
      </button>
    </div>
  );
}
