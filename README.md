# Instituto DJE — Protótipo do sistema de cadastros e doações

Protótipo navegável do sistema de cadastro de famílias e controle de doações do Instituto Leão da Tribo de Judá D.J.E.
Clickable prototype of a family registration and donation management system for the Instituto Leão da Tribo de Judá D.J.E. charity.

[🇧🇷 Português](#-português) · [🇺🇸 English](#-english)

---

## 🇧🇷 Português

Protótipo navegável para apresentação ao cliente (Gilmar, Instituto Leão da Tribo de Judá
D.J.E., Novo Gama/GO). **É só a máscara:** não tem banco de dados, login real, WhatsApp real
nem pagamento real. Todos os dados são fictícios e ficam no `localStorage` do navegador.

### Rodar

```bash
npm install
npm run dev        # http://localhost:3210
```

Antes de mostrar: `npm run typecheck`, `npm run lint` e `npx next build`.

### Entrar

Na tela de login há dois atalhos de demonstração:

- **Administrador** — `admin@instituto.org` / `123456`
- **Família** — `maria@exemplo.com` / `123456`

Para zerar tudo: Configurações → **Restaurar demonstração**.

### O que tem

| Rota | Quem usa | O que faz |
|---|---|---|
| `/login`, `/cadastro` | família | Entrar e cadastro em 7 passos (dados, endereço, familiares, itens, documentos, taxa, acesso) |
| `/minha-area` | família | Vê **só o próprio cadastro**: andamento, o que pediu, o que recebeu e o que falta |
| `/painel` | equipe | Indicadores: cadastros, fila, quem recebeu × não recebeu, demanda por item, entregas por mês |
| `/aprovacoes` | equipe | Aprovar todos, selecionados ou um a um (com ficha); recusar com motivo; reabrir |
| `/esteira` | equipe | Quadro por etapa, **mais antigo em cima**; filtros; mover (arrastar, seletor, em lote); editar etapas |
| `/familias`, `/familias/[id]` | equipe | Lista com busca e a ficha completa; registrar entrega; editar |
| `/atendimento` | equipe | Central de WhatsApp simulada: assistente virtual → fila → atendente → transferência |
| `/configuracoes` | equipe | Tipos de doação, etapas, equipe, restaurar demonstração |

### De onde veio

Visual e padrões copiados do **GRSCRM** (`../../GRS/CRM/GRSCRM`): tokens `.ns-shell` do
`globals.css`, menu lateral, tema claro/escuro, quadro da esteira do Jurídico, editor de etapas,
fila de aprovações. O atendimento simulado segue a versão de demonstração do `newseccrm`.
Empresa única: não há seletor de empresa nem operador de plataforma.

### Onde está cada coisa

- `src/lib/demo/tipos.ts` — formato dos dados.
- `src/lib/demo/semente.ts` — dados fictícios iniciais (42 famílias, 7 pessoas na equipe, 6 conversas).
- `src/lib/demo/armazem.tsx` — o "banco" falso. **Cada função dali vira uma chamada ao servidor no sistema real.**
- `src/components/` — `shell/` (menu, topo), `familia/` (ficha, entrega), `esteira/`, `atendimento/`, `ui/`.

### Pendências para virar sistema de verdade

- Banco, login e regra de acesso **no servidor** (hoje a barreira "família não vê o administrador" é só de tela).
- Guardar os documentos enviados (hoje só o nome do arquivo é registrado).
- WhatsApp e assistente virtual reais.
- **Taxa de adesão de R$ 10:** veio do desenho do cliente, mas na ligação ele disse que não cobra das
  famílias e o site atual diz que o instituto não recebe dinheiro. Confirmar com ele antes de construir pagamento.
- LGPD: o cadastro reúne CPF, NIS, renda e dados de crianças; precisa de termo de consentimento e política de privacidade.

---

## 🇺🇸 English

A clickable prototype built to present to the client, a charity in Novo Gama, Goiás. **It's a mock-up only:** there is no database, real login, real WhatsApp or real payments. All data is fictional and lives in the browser's `localStorage`.

### Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Lucide icons

### Running

```bash
npm install
npm run dev        # http://localhost:3210
```

Before a demo, run `npm run typecheck`, `npm run lint` and `npx next build`.

### Demo logins

- **Admin:** `admin@instituto.org` / `123456`
- **Family:** `maria@exemplo.com` / `123456`

To reset everything: Settings → **Restore demo**.

### What's inside

| Route | Who | What it does |
|---|---|---|
| `/login`, `/cadastro` | family | Sign-in and a 7-step registration (personal data, address, family members, items, documents, fee, access) |
| `/minha-area` | family | Sees **only their own record**: progress, what they asked for, received and what's pending |
| `/painel` | staff | KPIs: registrations, queue, who received vs. didn't, demand per item, deliveries per month |
| `/aprovacoes` | staff | Approve all, selected or one by one; reject with a reason; reopen |
| `/esteira` | staff | Kanban by stage, **oldest first**; filters; move (drag, select, bulk); edit stages |
| `/familias`, `/familias/[id]` | staff | Searchable list and full record; log a delivery; edit |
| `/atendimento` | staff | Simulated WhatsApp center: virtual assistant → queue → agent → transfer |
| `/configuracoes` | staff | Donation types, stages, team, restore demo |

### Code map

- `src/lib/demo/tipos.ts`: data types.
- `src/lib/demo/semente.ts`: initial fictional data (42 families, 7 staff members, 6 conversations).
- `src/lib/demo/armazem.tsx`: the fake "database". **Each function there becomes a server call in the real system.**
- `src/components/`: `shell/` (menu, top bar), `familia/` (record, delivery), `esteira/`, `atendimento/`, `ui/`.

### To become a real system

Server-side database, login and access rules; document storage; real WhatsApp and assistant; confirm the R$ 10 sign-up fee with the client before building payments; LGPD (Brazil's data protection law) consent and privacy policy, since the form collects CPF, NIS, income and children's data.
