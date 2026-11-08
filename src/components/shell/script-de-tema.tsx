export const CHAVE_TEMA = "instituto-tema";

/**
 * Lê o tema salvo e aplica no #ns-shell-root antes da primeira pintura.
 * Precisa ser o primeiro filho do wrapper (base: theme-script.tsx do GRSCRM).
 * Sem escolha salva, o padrão é o tema claro.
 */
export function ScriptDeTema() {
  const script = `
    (function () {
      try {
        var raiz = document.currentScript && document.currentScript.parentElement;
        if (!raiz) return;
        var salvo = localStorage.getItem("${CHAVE_TEMA}");
        raiz.setAttribute("data-theme", salvo === "dark" ? "dark" : "light");
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
