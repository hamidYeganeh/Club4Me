import { ReservationManagementScreen } from "@modules/clubs/screens/ReservationManagementScreen";
export default async function Page({ params, searchParams }: { params: Promise<{ clubId: string }>; searchParams: Promise<{ copy?: string }> }) {
  const { clubId } = await params; const { copy } = await searchParams;
  return <ReservationManagementScreen clubId={clubId} formPage="session" copySessionId={copy} />;
}
