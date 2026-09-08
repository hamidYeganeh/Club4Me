import { CoachPackagesScreen } from "@modules/coach-packages/CoachPackagesScreen";
export default async function Page({
  params,
}: {
  params: Promise<{ coachSlug: string }>;
}) {
  const { coachSlug } = await params;
  return <CoachPackagesScreen coachSlug={coachSlug} />;
}
