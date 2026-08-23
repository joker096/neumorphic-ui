import { MessageCircle, Phone, Users, Building2, LayoutGrid } from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "company", label: "settings.company", icon: Building2 },
  { id: "workplace", label: "nav.workplace", icon: LayoutGrid, adminOnly: true },
];

export function isCompanyAdmin(members: { userId: string; role?: string }[], userId: string): boolean {
  return members.some((m) => m.userId === userId && m.role === "admin");
}

export const NAV_IDS = NAV_ITEMS.map(i => i.id);
