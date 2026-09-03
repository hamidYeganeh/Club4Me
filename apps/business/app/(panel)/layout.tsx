import { AuthGate } from "@/components/auth-gate";
import { PanelShellScreen } from "@modules/shell/screens/PanelShellScreen";
import type { ReactNode } from "react";

export default function PanelLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <AuthGate>
      <PanelShellScreen>{children}</PanelShellScreen>
    </AuthGate>
  );
}
