"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { CHAVE_TEMA } from "./script-de-tema";

export function BotaoTema() {
  // Preenchido no mount a partir do DOM (já resolvido pelo script inline), sem divergir na hidratação.
  const [escuro, setEscuro] = useState<boolean | null>(null);

  useEffect(() => {
    setEscuro(document.getElementById("ns-shell-root")?.getAttribute("data-theme") === "dark");
  }, []);

  function alternar() {
    const proximo = !(escuro ?? false);
    setEscuro(proximo);
    const tema = proximo ? "dark" : "light";
    document.getElementById("ns-shell-root")?.setAttribute("data-theme", tema);
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
    } catch {
      // Sem localStorage o tema vale só para esta visita.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--ns-border)] text-[var(--ns-text-secondary)] transition hover:bg-[var(--ns-surface-hover)]"
    >
      {escuro ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
    </button>
  );
}
