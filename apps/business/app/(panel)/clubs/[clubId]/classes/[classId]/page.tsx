import { BusinessClassDetailScreen } from "@modules/classes/screens/BusinessClassesScreens";

export default async function Page({
  params,
}: {
  params: Promise<{ clubId: string; classId: string }>;
}) {
  const { clubId, classId } = await params;
  return <BusinessClassDetailScreen clubId={clubId} classId={classId} />;
}
