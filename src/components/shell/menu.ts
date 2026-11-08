import { ClipboardCheck, KanbanSquare, LayoutDashboard, MessagesSquare, Settings, Users, type LucideIcon } from "lucide-react";

export type ItemMenu = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  grupo: "cadastros" | "atendimento" | "sistema";
};

export const ITENS_MENU: ItemMenu[] = [
  { href: "/painel", rotulo: "Painel", icone: LayoutDashboard, grupo: "cadastros" },
  { href: "/aprovacoes", rotulo: "Aprovações", icone: ClipboardCheck, grupo: "cadastros" },
  { href: "/esteira", rotulo: "Esteira de doações", icone: KanbanSquare, grupo: "cadastros" },
  { href: "/familias", rotulo: "Famílias", icone: Users, grupo: "cadastros" },
  { href: "/atendimento", rotulo: "Atendimento", icone: MessagesSquare, grupo: "atendimento" },
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings, grupo: "sistema" },
];

export const GRUPOS_MENU: Array<{ id: ItemMenu["grupo"]; titulo: string }> = [
  { id: "cadastros", titulo: "Cadastros" },
  { id: "atendimento", titulo: "Atendimento" },
  { id: "sistema", titulo: "Sistema" },
];
