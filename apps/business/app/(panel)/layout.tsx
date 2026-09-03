import { PanelShellScreen } from "@modules/shell/screens/PanelShellScreen";
import type { ReactNode } from "react";

export default function PanelLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <PanelShellScreen>{children}</PanelShellScreen>;
}
