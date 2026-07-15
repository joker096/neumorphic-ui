import type { ComponentType } from "react";
import { Globe, Lock, MessageCircle, Radio, Shield, Users, Zap } from "lucide-react";

export type LandingFeature = {
  icon: ComponentType<{ size: number; className?: string }>;
  title: string;
  desc: string;
};

export type SecurityItem = {
  icon: ComponentType<{ size: number; className?: string }>;
  title: string;
  desc: string;
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: MessageCircle,
    title: "Encrypted Messaging",
    desc: "End-to-end encrypted conversations with perfect forward secrecy. No metadata, no tracking.",
  },
  {
    icon: Radio,
    title: "P2P Mesh Network",
    desc: "Direct peer-to-peer connections and relay fallback. Your data never touches centralized servers.",
  },
  {
    icon: Shield,
    title: "Zero-Knowledge Architecture",
    desc: "We cannot read your messages. We cannot recover your keys. Your privacy is by design, not policy.",
  },
  {
    icon: Globe,
    title: "Decentralized Identity",
    desc: "Self-sovereign identity with no phone number, no email, no central authority required.",
  },
];

export const SECURITY_ITEMS: SecurityItem[] = [
  {
    icon: Lock,
    title: "End-to-End Encrypted",
    desc: "X25519 + AEAD-256. Perfect forward secrecy. Your keys never leave your device.",
  },
  {
    icon: Users,
    title: "Zero Metadata",
    desc: "No message timestamps, no IP logging, no contact graph harvesting. Nothing to leak.",
  },
  {
    icon: Shield,
    title: "Open Source",
    desc: "Full source transparency. Independent audits. No backdoors, no compromises.",
  },
];

export const easeOut = [0.32, 0.72, 0, 1] as const;

export const sectionFadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: easeOut },
};

export const staggerItem = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: easeOut },
};
