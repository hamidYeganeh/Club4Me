import type { PanelRailItem } from "@modules/shell/sections/PanelRailSection/PanelRailSection.types";

export type PanelHeaderSectionProps = {
  searchPlaceholder: string;
  settingsHref: string;
  settingsLabel: string;
  notificationsLabel: string;
  menuLabel: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  addHref: string;
  addLabel: string;
  items: PanelRailItem[];
};
