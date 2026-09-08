import { CoachOfferingFormScreen } from "@modules/coach/screens/CoachOfferingFormScreen/CoachOfferingFormScreen";
export default async function Page({
  params,
}: {
  params: Promise<{ offeringId: string }>;
}) {
  const { offeringId } = await params;
  return <CoachOfferingFormScreen offeringId={offeringId} />;
}
