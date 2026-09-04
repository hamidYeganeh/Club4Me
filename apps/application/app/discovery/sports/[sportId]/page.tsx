import { DISCOVERY_CATEGORIES } from "@modules/discovery/discovery-catalog.constants";
import { DiscoveryCategoryScreen } from "@modules/discovery/screens/DiscoveryCategoryScreen";

type PageProps = { params: Promise<{ sportId: string }> };
export function generateStaticParams() {
  return DISCOVERY_CATEGORIES.sports.map(({ id }) => ({ sportId: id }));
}
export default async function SportPage({ params }: PageProps) {
  const { sportId } = await params;
  return <DiscoveryCategoryScreen type="sports" id={sportId} />;
}
