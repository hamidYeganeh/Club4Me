import type { ComponentType } from "react";

export type LandingSportsSectionProps = {
  className?: string;
};

export type LandingSportTile = {
  id: string;
  name: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  image: string;
};
