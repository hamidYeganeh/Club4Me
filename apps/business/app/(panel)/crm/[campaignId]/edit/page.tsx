import { CrmFormScreen } from "@/modules/crm/CrmFormScreen";

export default async function Page({ params, searchParams }: { params: Promise<{ campaignId: string }>; searchParams: Promise<{ clubId?: string }> }) {
  const { campaignId } = await params;
  const { clubId } = await searchParams;
  return <CrmFormScreen campaignId={campaignId} requestedClubId={clubId} />;
}
