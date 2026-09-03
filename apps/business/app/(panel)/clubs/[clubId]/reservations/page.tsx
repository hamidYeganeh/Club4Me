import { ReservationManagementScreen } from "@modules/clubs/screens/ReservationManagementScreen";

export default async function ClubReservationsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ReservationManagementScreen clubId={clubId} />;
}
