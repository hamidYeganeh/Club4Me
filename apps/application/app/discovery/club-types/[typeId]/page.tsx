import { redirect } from "next/navigation";
import { getDiscoverySlugParams } from "@/lib/discovery-static-params";

type PageProps = { params: Promise<{ typeId: string }> };
export function generateStaticParams() {
  return getDiscoverySlugParams(
    "/sports/club_types?action=options&limit=100",
    "typeId",
  );
}
export default async function ClubTypePage({ params }: PageProps) {
  const { typeId } = await params;
  redirect(`/discovery/clubs?club_types=${encodeURIComponent(typeId)}`);
}
