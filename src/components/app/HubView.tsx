import React from "react";
import { motion } from "motion/react";
import { RadialMenu } from "../AppChrome";

type HubItem = {
  id: string;
  angle: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
};

type HubViewProps = {
  theme: "light" | "dark";
  items: HubItem[];
  badges?: Record<string, number>;
  centerTitle: string;
  onItemClick: (id: string) => void;
};

export const HubView = ({ theme, items, badges, centerTitle, onItemClick }: HubViewProps) => (
  <motion.div
    key="hub-view"
    className="flex-1 w-full h-[100dvh] bg-transparent flex flex-col items-center justify-center relative z-10"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 w-full h-full flex items-center justify-center"
    >
      <RadialMenu
        theme={theme}
        items={items}
        badges={badges}
        centerTitle={centerTitle}
        onItemClick={onItemClick}
      />
    </motion.div>
  </motion.div>
);
