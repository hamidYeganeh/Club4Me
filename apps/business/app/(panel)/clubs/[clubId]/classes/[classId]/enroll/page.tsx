import { BusinessClassEnrollScreen } from "@modules/classes/screens/BusinessClassActionScreens";
export default async function Page({ params }: { params: Promise<{ clubId: string; classId: string }> }) {
  const { clubId, classId } = await params; return <BusinessClassEnrollScreen clubId={clubId} classId={classId} />;
}
