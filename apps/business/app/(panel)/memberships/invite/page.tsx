import { MembershipFormScreen } from "@/modules/memberships/MembershipFormScreen";
export default async function Page({ searchParams }: { searchParams: Promise<{ clubId?: string }> }) {
  const { clubId } = await searchParams; return <MembershipFormScreen mode="invite" requestedClubId={clubId} />;
}
