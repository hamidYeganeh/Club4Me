"use client";
import { usePublicClubClasses } from "@api";
import { ClassCard } from "./ClassCard";
import { DiscoveryQueryState } from "./DiscoveryQueryState";
import { DiscoverySectionHeader } from "./DiscoverySectionHeader";
import { ClassCardSkeleton } from "./skeletons/ClassCardSkeleton";
export function RelatedBusinessClasses({
  excludeId,
  clubId,
}: {
  excludeId: string;
  clubId: string;
}) {
  const query = usePublicClubClasses({ clubId, limit: 9 });
  const items = (query.data?.items ?? []).filter(
    (item) => item.id !== excludeId,
  );
  if (query.isSuccess && !items.length) return null;
  return (
    <section className="space-y-4">
      <DiscoverySectionHeader
        title="کلاس‌های مشابه"
        icon="academic-cap"
        viewAllLabel="مشاهده همه"
        viewAllUrl={`/discovery/classes?clubId=${clubId}`}
      />
      <DiscoveryQueryState query={query} />
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {query.isPending ? (
          <ClassCardSkeleton />
        ) : (
          items.map((item) => (
            <ClassCard
              key={item.id}
              title={item.title}
              description={item.description}
              remaining={item.remainingCapacity}
              price={item.price}
              currency={item.currency}
              startAt={item.startDate}
              href={`/discovery/business-class?classId=${item.id}`}
              badge="کلاس باشگاه"
              className="w-[min(78vw,19rem)] shrink-0 snap-start"
            />
          ))
        )}
      </div>
    </section>
  );
}
