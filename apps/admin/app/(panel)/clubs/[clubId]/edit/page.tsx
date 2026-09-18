import { ClubFormScreen } from "@modules/clubs/screens/ClubFormScreen/ClubFormScreen";

type ClubEditPageProps = {
  params: Promise<{ clubId: string }>;
};

export default async function ClubEditPage({ params }: ClubEditPageProps) {
  const { clubId } = await params;
  return <ClubFormScreen clubId={clubId} />;
}
