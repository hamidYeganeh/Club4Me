import { ClubFormScreen } from "@modules/clubs/screens/ClubFormScreen";

export default async function ClubEditPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  return <ClubFormScreen clubId={clubId} />;
}
