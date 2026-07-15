import { MessageCircle, Phone, Settings, Users, Building2 } from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "company", label: "settings.company", icon: Building2 },
  { id: "settings", label: "nav.settings", icon: Settings },
];

export const NAV_IDS = NAV_ITEMS.map(i => i.id);
