import { CoachFormScreen } from "@/modules/operations/screens/CoachFormScreen";
export default async function Page({ searchParams }: { searchParams: Promise<{ clubId?: string }> }) {
  const { clubId } = await searchParams;
  return <CoachFormScreen requestedClubId={clubId} />;
}
