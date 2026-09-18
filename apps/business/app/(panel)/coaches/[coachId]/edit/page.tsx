import { CoachFormScreen } from "@/modules/operations/screens/CoachFormScreen";
export default async function Page({ params, searchParams }: { params: Promise<{ coachId: string }>; searchParams: Promise<{ clubId?: string }> }) {
  const { coachId } = await params; const { clubId } = await searchParams;
  return <CoachFormScreen coachId={coachId} requestedClubId={clubId} />;
}
