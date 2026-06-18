import { motion } from "motion/react";
import type { ComponentType, SVGProps } from "react";
import { AccountSwitcher } from "../AccountSwitcher";
import { RadialMenu } from "../AppChrome";

type HubItem = {
  id: string;
  angle: number;
  title: string;
  subtitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type HubViewProps = {
  theme: "light" | "dark";
  items: HubItem[];
  badges?: Record<string, number>;
  centerTitle: string;
  centerSubtitle: string;
  onItemClick: (id: string) => void;
};

export const HubView = ({ theme, items, badges, centerTitle, centerSubtitle, onItemClick }: HubViewProps) => (
  <motion.div
    key="hub-view"
    className="flex-1 w-full h-[100dvh] bg-transparent flex flex-col items-center justify-center relative z-10"
  >
    <AccountSwitcher theme={theme} />
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 scale-[0.30] min-[400px]:scale-[0.34] sm:scale-[0.6] md:scale-90 lg:scale-100 flex-1 flex flex-col items-center justify-center"
    >
      <RadialMenu
        theme={theme}
        items={items}
        badges={badges}
        centerTitle={centerTitle}
        centerSubtitle={centerSubtitle}
        onCenterClick={() => {}}
        onItemClick={onItemClick}
      />
    </motion.div>
  </motion.div>
);
