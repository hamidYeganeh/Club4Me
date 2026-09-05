import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";

export function DiscoveryEmptyPage({
  headerTitle,
  title,
  description,
}: {
  headerTitle: string;
  title: string;
  description?: string;
}) {
  return (
    <main className="app-page gap-8">
      <SecondaryHeader title={headerTitle} />
      <div className="flex min-h-[60dvh] items-center">
        <div className="w-full">
          <DiscoveryEmptySection title={title} subtitle={description} />
        </div>
      </div>
    </main>
  );
}
