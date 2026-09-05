import { DiscoveryClubGalleryScreen } from "@modules/discovery/screens/DiscoveryClubGalleryScreen";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = {
  params: Promise<{ clubId: string }>;
};

export function generateStaticParams() {
  return getDiscoverySlugParams("/discovery/catalog/clubs?limit=100", "clubId");
}

export default async function ClubGalleryPage({ params }: PageProps) {
  const { clubId } = await params;
  return <DiscoveryClubGalleryScreen clubId={clubId} />;
}
