import { ReservationManagementScreen } from "@modules/clubs/screens/ReservationManagementScreen";
export default async function Page({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  return <ReservationManagementScreen clubId={clubId} formPage="court" />;
}
