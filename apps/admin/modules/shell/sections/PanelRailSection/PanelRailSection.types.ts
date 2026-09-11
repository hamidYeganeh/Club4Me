import type { IconName } from "@theme/icon";

export type PanelRailItem = {
  href: string;
  icon: IconName;
  label: string;
  exact?: boolean;
};

export type PanelRailSectionProps = {
  items: PanelRailItem[];
  avatarSrc?: string;
  avatarAlt: string;
};
