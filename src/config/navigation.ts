import { MessageCircle, Phone, Users, Building2, LayoutGrid } from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "company", label: "settings.company", icon: Building2 },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "workplace", label: "nav.workplace", icon: LayoutGrid },
];

export const NAV_IDS = NAV_ITEMS.map(i => i.id);
