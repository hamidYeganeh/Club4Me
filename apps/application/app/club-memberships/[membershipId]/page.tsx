import { ClubMembershipInvitationScreen } from "@modules/account/screens/ClubMembershipInvitationScreen";

export default async function ClubMembershipInvitationPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await params;
  return <ClubMembershipInvitationScreen membershipId={membershipId} />;
}
