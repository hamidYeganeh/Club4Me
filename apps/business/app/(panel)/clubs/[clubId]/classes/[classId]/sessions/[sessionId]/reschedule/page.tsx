import { BusinessClassRescheduleScreen } from "@modules/classes/screens/BusinessClassActionScreens";
export default async function Page({ params }: { params: Promise<{ clubId: string; classId: string; sessionId: string }> }) {
  const { clubId, classId, sessionId } = await params;
  return <BusinessClassRescheduleScreen clubId={clubId} classId={classId} sessionId={sessionId} />;
}
