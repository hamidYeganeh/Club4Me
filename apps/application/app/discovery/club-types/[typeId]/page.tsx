import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ typeId: string }> };
export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/public/catalog/sports/club-type?limit=100",
    "typeId",
  );
}
export default async function ClubTypePage({ params }: PageProps) {
  const { typeId } = await params;
  return <DiscoveryCategoryScreen type="club-types" id={typeId} />;
}
