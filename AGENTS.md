# AGENTS.md — institutodje-app

Protótipo (sem banco) do sistema de cadastros e doações do Instituto Leão da Tribo de Judá D.J.E.
Leia o `README.md` antes de mexer: ele tem rotas, contas de demonstração e pendências.

## Regras

- **Tudo em pt-BR**: código, nomes, comentários, commits. O Gabriel não fala inglês.
- **Sem Git remoto e sem publicação.** Só publicar com pedido explícito do Gabriel.
- **Só dado fictício.** Nunca colocar nome, CPF, NIS ou telefone de família real neste repositório.
- É projeto de **outro cliente**: nada de GRS Soluções nem de NewSec em tela, texto ou commit.
- Empresa única. Não reintroduzir multiempresa, seletor de empresa ou operador de plataforma.
- Visual: tokens `.ns-shell` em `src/app/globals.css` (copiados do GRSCRM). Reutilizar `ns-btn-*`,
  `ns-card`, `ns-input`, `ns-badge-*` e as peças de `src/components/ui/` antes de criar outras.
- Toda leitura e escrita de dados passa por `src/lib/demo/armazem.tsx`. Tela não mexe em `localStorage` direto.
- Mudou o formato dos dados em `tipos.ts`? Suba `VERSAO_DADOS` em `semente.ts`, senão o navegador
  carrega dado velho incompatível.
- Etapas com `papel` (`entrada`, `fila`, `concluida`) podem ser renomeadas, mas não excluídas: a lógica
  de aprovação e de entrega depende delas.
- Regra da esteira: dentro de cada etapa, ordem por `entrouNaEtapaEm` crescente (mais antigo em cima).

## Validar

`npm run typecheck`, `npm run lint`, `npx next build`. Depois conferir no navegador em largura de
celular (390 px) e de computador, nos temas claro e escuro. Porta do projeto: **3210**.
