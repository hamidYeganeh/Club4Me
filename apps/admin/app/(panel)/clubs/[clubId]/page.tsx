import { ClubDetailScreen } from "@modules/clubs/screens/ClubDetailScreen/ClubDetailScreen";

type ClubDetailPageProps = {
  params: Promise<{ clubId: string }>;
};

export default async function ClubDetailPage({ params }: ClubDetailPageProps) {
  const { clubId } = await params;
  return <ClubDetailScreen clubId={clubId} />;
}
