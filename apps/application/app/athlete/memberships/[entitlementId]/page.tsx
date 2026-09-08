import { MembershipsScreen } from "@modules/benefits/screens/MembershipsScreen";
export default async function Page({
  params,
}: {
  params: Promise<{ entitlementId: string }>;
}) {
  const { entitlementId } = await params;
  return <MembershipsScreen entitlementId={entitlementId} />;
}
