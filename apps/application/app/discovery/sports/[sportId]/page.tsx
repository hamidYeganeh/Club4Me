import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ sportId: string }> };
export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/public/catalog/sports/sport?limit=100",
    "sportId",
  );
}
export default async function SportPage({ params }: PageProps) {
  const { sportId } = await params;
  return <DiscoveryCategoryScreen type="sports" id={sportId} />;
}
