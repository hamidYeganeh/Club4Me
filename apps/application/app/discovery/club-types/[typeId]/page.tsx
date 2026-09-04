import { DISCOVERY_CATEGORIES } from "@modules/discovery/discovery-catalog.constants";
import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen";

type PageProps = { params: Promise<{ typeId: string }> };
export function generateStaticParams() {
  return DISCOVERY_CATEGORIES["club-types"].map(({ id }) => ({ typeId: id }));
}
export default async function ClubTypePage({ params }: PageProps) {
  const { typeId } = await params;
  return <DiscoveryCategoryScreen type="club-types" id={typeId} />;
}
