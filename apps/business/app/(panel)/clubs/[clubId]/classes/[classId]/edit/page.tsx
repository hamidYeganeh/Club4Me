import { BusinessClassFormScreen } from "@modules/classes/screens/BusinessClassesScreens";

export default async function Page({
  params,
}: {
  params: Promise<{ clubId: string; classId: string }>;
}) {
  const { clubId, classId } = await params;
  return <BusinessClassFormScreen clubId={clubId} classId={classId} />;
}
