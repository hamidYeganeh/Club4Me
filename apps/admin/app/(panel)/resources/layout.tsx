import type { ReactNode } from "react";
import { ResourceNavigation } from "@modules/resources/components/ResourceNavigation";

export default function ResourcesLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <ResourceNavigation />
      {children}
    </div>
  );
}
