import Image from "next/image";
import { DiscoverySectionHeader } from "./DiscoverySectionHeader";
import type { IconName } from "@theme/icon";

export function DiscoveryEmptySection({
  title,
  subtitle,
  icon = "magnifying-glass",
  viewAllLabel,
  viewAllUrl,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  viewAllLabel?: string;
  viewAllUrl?: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <DiscoverySectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllLabel={viewAllLabel}
        viewAllUrl={viewAllUrl}
      />
      <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-border bg-surface px-5 py-6 text-center">
        <Image
          src="/discovery/no-slots.png"
          alt=""
          width={160}
          height={104}
          className="h-24 w-auto object-contain opacity-90 drop-shadow-lg"
        />
        <p className="mt-3 text-sm font-bold text-foreground">
          هنوز نتیجه‌ای در این بخش نیست
        </p>
        <p className="mt-1 max-w-[30ch] text-xs leading-5 text-muted">
          با اضافه شدن محتوای جدید، پیشنهادها اینجا نمایش داده می‌شوند.
        </p>
      </div>
    </section>
  );
}
