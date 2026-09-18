import { ReservationManagementScreen } from "@modules/clubs/screens/ReservationManagementScreen";
export default async function Page({ params }: { params: Promise<{ clubId: string; courtId: string }> }) {
  const { clubId, courtId } = await params;
  return <ReservationManagementScreen clubId={clubId} formPage="court" editCourtId={courtId} />;
}
