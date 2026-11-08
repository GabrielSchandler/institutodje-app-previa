import { FlaskConical } from "lucide-react";

export function FaixaDemo() {
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 border-b border-[var(--ns-border)] bg-[color-mix(in_srgb,var(--ns-warning)_12%,var(--ns-surface))] px-4 py-1.5 text-center text-xs font-medium text-[var(--ns-text)]">
      <FlaskConical aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[var(--ns-warning)]" />
      Demonstração: os dados são fictícios e nada é enviado de verdade.
    </div>
  );
}
