import { ClubBookingWidget } from "@modules/discovery/screens/ClubBookingWidget";
export default async function Page({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ClubBookingWidget clubId={clubId} />;
}
