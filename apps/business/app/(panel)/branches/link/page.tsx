import { BranchLinkScreen } from "@/modules/operations/screens/BranchLinkScreen";
export default async function Page({ searchParams }: { searchParams: Promise<{ clubId?: string }> }) {
  const { clubId } = await searchParams;
  return <BranchLinkScreen requestedClubId={clubId} />;
}
