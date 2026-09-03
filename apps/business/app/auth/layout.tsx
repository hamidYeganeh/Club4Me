import { GuestGate } from "@/components/guest-gate";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <GuestGate>{children}</GuestGate>;
}
