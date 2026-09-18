import { CrmFormScreen } from "@/modules/crm/CrmFormScreen";

export default async function Page({ searchParams }: { searchParams: Promise<{ clubId?: string }> }) {
  const { clubId } = await searchParams;
  return <CrmFormScreen requestedClubId={clubId} />;
}
