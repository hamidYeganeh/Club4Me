import { AuthGate } from "@/components/auth-gate";
import { ClubMembershipInvitationScreen } from "@modules/account/screens/ClubMembershipInvitationScreen";

export default async function ClubMembershipInvitationPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  return (
    <AuthGate>
      <ClubMembershipInvitationScreen membershipId={membershipId} />
    </AuthGate>
  );
}
