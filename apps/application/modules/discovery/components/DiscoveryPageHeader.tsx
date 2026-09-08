"use client";
import { DiscoveryImageHero } from "./DiscoveryImageHero";
import type { ReactNode } from "react";
import { SecondaryHeader } from "./SecondaryHeader";

/** Compatibility adapter: discovery pages share the secondary navigation header. */
export function DiscoveryPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  overlay?: boolean;
}) {
  return (
    <>
      <SecondaryHeader title={title} showFilter={false} action={action} />
      {description ? (
        <div className="my-5">
          <DiscoveryImageHero
            compact
            imageUrl="/profile/cover.jpg"
            eyebrow={title}
            title={description}
          />
        </div>
      ) : null}
    </>
  );
}
