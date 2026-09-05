import { ReservationDetailsScreen } from "@modules/reservations/screens/ReservationDetailsScreen";

type PageProps = {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<{ source?: string }>;
};

export default async function ReservationDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { reservationId } = await params;
  const { source: requestedSource } = await searchParams;
  const source =
    requestedSource === "coach" || requestedSource === "class"
      ? requestedSource
      : "club";

  return (
    <ReservationDetailsScreen reservationId={reservationId} source={source} />
  );
}
