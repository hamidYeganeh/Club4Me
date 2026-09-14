"use client";
import { PanelDesktopNavigation } from "@repo/ui/panel-navigation";
import { usePathname } from "next/navigation";
import type { PanelRailSectionProps } from "./PanelRailSection.types";
export function PanelRailSection({ items }: PanelRailSectionProps) {
  return (
    <PanelDesktopNavigation
      items={items}
      pathname={usePathname()}
      business={true}
    />
  );
}
